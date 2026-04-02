import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, ctx: RouteContext<'/api/messages/[id]/replies'>) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: parentId } = await ctx.params
  const replies = await prisma.message.findMany({
    where: { threadId: parentId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      reactions: true, attachments: true,
    },
  })

  const parent = await prisma.message.findUnique({
    where: { id: parentId, isDeleted: false },
    include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } } },
  })
  if (!parent) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId: parent.channelId } },
  })
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json({ parent, replies })
}
