import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, ctx: RouteContext<'/api/dm/[id]'>) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: otherUserId } = await ctx.params
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  const limit = 50

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
      isDeleted: false,
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true,
    },
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()
  const nextCursor = hasMore ? messages[0]?.id : null  // oldest in batch = first in desc order
  messages.reverse()  // flip to asc for display
  return NextResponse.json({ messages, nextCursor })
}
