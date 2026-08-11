import { NextResponse } from 'next/server'
import { readStore, writeStore } from '@/lib/store'
import type { Application } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await readStore()
  return NextResponse.json([...store.applications].reverse())
}

export async function POST(request: Request) {
  const body = await request.json()
  const store = await readStore()
  const application: Application = {
    ...body,
    id: `APP-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'new',
    updatedAt: new Date().toISOString(),
  }
  store.applications.push(application)
  await writeStore(store)
  return NextResponse.json({ ok: true, id: application.id }, { status: 201 })
}

export async function PATCH(request: Request) {
  const { id, status } = await request.json()
  const store = await readStore()
  const item = store.applications.find((app) => app.id === id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  item.status = status
  item.updatedAt = new Date().toISOString()
  await writeStore(store)
  return NextResponse.json({ ok: true, application: item })
}
