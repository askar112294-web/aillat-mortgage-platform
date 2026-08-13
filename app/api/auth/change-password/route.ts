import { NextResponse } from 'next/server'
import {
  createPasswordRecord,
  isAdminAuthenticated,
  readAdminUser,
  verifyAdminCredentials,
  writeAdminUser,
} from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated()

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()

    const currentPassword =
      typeof body.currentPassword === 'string'
        ? body.currentPassword
        : ''

    const newPassword =
      typeof body.newPassword === 'string'
        ? body.newPassword
        : ''

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Заполните все поля' },
        { status: 400 },
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать минимум 8 символов' },
        { status: 400 },
      )
    }

    const valid = await verifyAdminCredentials(
      'admin',
      currentPassword,
    )

    if (!valid) {
      return NextResponse.json(
        { error: 'Текущий пароль указан неверно' },
        { status: 400 },
      )
    }

    const user = await readAdminUser()
    const passwordRecord = createPasswordRecord(newPassword)

    await writeAdminUser({
      ...user,
      ...passwordRecord,
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('CHANGE PASSWORD ERROR:', error)

    return NextResponse.json(
      { error: 'Не удалось изменить пароль' },
      { status: 500 },
    )
  }
}