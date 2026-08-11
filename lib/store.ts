import { promises as fs } from 'fs'
import path from 'path'
import type { Store } from './types'

const storePath = path.join(process.cwd(), 'data', 'store.json')

export async function readStore(): Promise<Store> {
  return JSON.parse(await fs.readFile(storePath, 'utf8')) as Store
}

export async function writeStore(store: Store) {
  await fs.writeFile(storePath, JSON.stringify(store, null, 2), 'utf8')
  return store
}
