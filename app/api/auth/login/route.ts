import { NextResponse } from 'next/server'
import {
  createAdminSession,
  verifyAdminCredentials,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const username =
      typeof body.username === 'string'
        ? body.username.trim()
        : ''

    const password =
      typeof body.password === 'string'
        ? body.password
        : ''

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 },
      )
    }

    const valid = await verifyAdminCredentials(
      username,
      password,
    )

    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      )
    }

    await createAdminSession(username)

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 },
    )
  }
}