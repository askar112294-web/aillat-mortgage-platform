import { NextResponse } from 'next/server'
import { readStore, writeStore } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = await readStore()
  return NextResponse.json({ product: store.product, partners: store.partners, projects: store.projects })
}

export async function PUT(request: Request) {
  const patch = await request.json()
  const store = await readStore()
  if (patch.product) store.product = patch.product
  if (patch.partners) store.partners = patch.partners
  if (patch.projects) store.projects = patch.projects
  await writeStore(store)
  return NextResponse.json({ ok: true, product: store.product, partners: store.partners, projects: store.projects })
}
