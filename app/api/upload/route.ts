import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { minioClient, FILE_BUCKET } from '@/lib/minio'
import { hasPermission } from '@/lib/permissions'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'file:upload')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 })

  // Allowlist of safe extensions and their canonical MIME types
  const ALLOWED: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
    txt: 'text/plain', md: 'text/markdown',
    zip: 'application/zip', mp4: 'video/mp4', mp3: 'audio/mpeg', webm: 'video/webm',
  }
  const ext = (file.name.split('.').pop() ?? '').toLowerCase()
  const safeMime = ALLOWED[ext]
  if (!safeMime) return NextResponse.json({ error: 'File type not allowed' }, { status: 415 })

  const fileKey = `uploads/${session.user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await minioClient.putObject(FILE_BUCKET, fileKey, buffer, file.size, { 'Content-Type': safeMime })

  return NextResponse.json({ fileKey, fileName: file.name, fileSize: file.size, mimeType: file.type })
}
