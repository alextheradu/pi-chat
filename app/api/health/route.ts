import { NextResponse } from 'next/server'

import { minioClient } from '@/lib/minio'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const services: Record<string, 'ok' | 'error'> = {
    db: 'ok',
    minio: 'ok',
  }

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    services.db = 'error'
  }

  try {
    await minioClient.listBuckets()
  } catch {
    services.minio = 'error'
  }

  const status = Object.values(services).every((service) => service === 'ok')
    ? 'ok'
    : 'degraded'

  return NextResponse.json(
    {
      status,
      services,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 }
  )
}
