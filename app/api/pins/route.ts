import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = req.nextUrl.searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  const pins = await prisma.pinnedMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    include: {
      message: { include: { author: { select: { name: true, displayName: true } } } },
      pinnedBy: { select: { name: true, displayName: true } },
    },
  })

  return NextResponse.json({ pins })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'message:pin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { messageId, channelId } = await req.json() as { messageId: string; channelId: string }
  const pin = await prisma.pinnedMessage.create({
    data: { messageId, channelId, pinnedById: session.user.id },
  })
  return NextResponse.json({ pin }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'message:pin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { messageId } = await req.json() as { messageId: string }
  await prisma.pinnedMessage.delete({ where: { messageId } })
  return NextResponse.json({ ok: true })
}
