import { NextResponse } from 'next/server'
import { deleteAdminSession } from '@/lib/admin-auth'

export async function POST() {
  try {
    await deleteAdminSession()

    return NextResponse.json({
      success: true,
    })
  } catch {
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 },
    )
  }
}