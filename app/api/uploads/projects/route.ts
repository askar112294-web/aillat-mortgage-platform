import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024

const allowedTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function getExtension(file: File) {
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  return 'bin'
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Файл не передан' },
        { status: 400 },
      )
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        { error: 'Поддерживаются только JPG, PNG и WebP' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Максимальный размер файла — 5 МБ' },
        { status: 400 },
      )
    }

    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'projects',
    )

    await mkdir(uploadDir, { recursive: true })

    const extension = getExtension(file)
    const fileName = `project-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`

    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()

    await writeFile(filePath, Buffer.from(bytes))

    return NextResponse.json({
      url: `/uploads/projects/${fileName}`,
    })
  } catch (error) {
    console.error('Project image upload error:', error)

    return NextResponse.json(
      { error: 'Не удалось загрузить изображение' },
      { status: 500 },
    )
  }
}
