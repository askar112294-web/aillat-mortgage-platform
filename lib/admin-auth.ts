import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'

const USER_FILE = path.join(process.cwd(), 'data', 'admin-user.json')

const SESSION_COOKIE = 'ailat_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 часов

export type AdminUser = {
  username: string
  salt: string
  passwordHash: string
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET

  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured')
  }

  return secret
}

function hashPassword(password: string, salt: string): string {
  return crypto
    .scryptSync(password, salt, 64)
    .toString('hex')
}

export function createPasswordRecord(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')

  return {
    salt,
    passwordHash: hashPassword(password, salt),
  }
}

export async function readAdminUser(): Promise<AdminUser> {
  const raw = await fs.readFile(USER_FILE, 'utf8')
  return JSON.parse(raw)
}

export async function writeAdminUser(user: AdminUser) {
  await fs.writeFile(
    USER_FILE,
    JSON.stringify(user, null, 2),
    'utf8',
  )
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    const user = await readAdminUser()

    console.log('AUTH DEBUG:', {
      usernameReceived: username,
      usernameStored: user.username,
      passwordLength: password.length,
      userFile: USER_FILE,
    })

    if (username !== user.username) {
      console.log('AUTH DEBUG: username mismatch')
      return false
    }

    const incomingHash = hashPassword(password, user.salt)

    const matched = incomingHash === user.passwordHash

    console.log('AUTH DEBUG: password matched =', matched)

    return matched
  } catch (error) {
    console.error('AUTH DEBUG ERROR:', error)
    return false
  }
}

function createSessionToken(username: string): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000

  const payload = Buffer.from(
    JSON.stringify({
      username,
      expiresAt,
    }),
  ).toString('base64url')

  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url')

  return `${payload}.${signature}`
}

function verifySessionToken(token: string): boolean {
  try {
    const [payload, signature] = token.split('.')

    if (!payload || !signature) return false

    const expectedSignature = crypto
      .createHmac('sha256', getSessionSecret())
      .update(payload)
      .digest('base64url')

    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSignature)

    if (a.length !== b.length) return false

    if (!crypto.timingSafeEqual(a, b)) return false

    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    )

    return (
      session.username === 'admin' &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt > Date.now()
    )
  } catch {
    return false
  }
}

export async function createAdminSession(username: string) {
  const cookieStore = await cookies()

  cookieStore.set({
    name: SESSION_COOKIE,
    value: createSessionToken(username),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function deleteAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return false

  return verifySessionToken(token)
}