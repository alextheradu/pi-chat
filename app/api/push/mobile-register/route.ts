import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let userId: string
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), secret)
    userId = payload.userId as string
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = await req.json() as { pushToken?: string; platform?: string }
  if (!body.pushToken || !body.platform) {
    return NextResponse.json({ error: 'pushToken and platform required' }, { status: 400 })
  }

  await prisma.mobilePushToken.upsert({
    where: { token: body.pushToken },
    update: { userId },
    create: { userId, token: body.pushToken, platform: body.platform },
  })

  return NextResponse.json({ ok: true })
}
