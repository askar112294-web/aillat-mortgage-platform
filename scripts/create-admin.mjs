import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

const password = process.argv[2]

if (!password || password.length < 8) {
  console.error('Пароль должен содержать минимум 8 символов.')
  console.error('Пример: node scripts/create-admin.mjs "MyPassword123!"')
  process.exit(1)
}

const salt = crypto.randomBytes(16).toString('hex')

const passwordHash = crypto
  .scryptSync(password, salt, 64)
  .toString('hex')

const user = {
  username: 'admin',
  salt,
  passwordHash,
}

const file = path.join(process.cwd(), 'data', 'admin-user.json')

await fs.writeFile(
  file,
  JSON.stringify(user, null, 2),
  'utf8'
)

console.log('Пользователь admin создан.')