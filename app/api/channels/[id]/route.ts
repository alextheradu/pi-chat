import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: {
      subdivision: true,
      _count: { select: { members: true, messages: true } },
    },
  })
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId: id } },
  })
  if (!membership) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ channel })
}
