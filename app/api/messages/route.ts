import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = req.nextUrl.searchParams.get('channelId')
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId } },
  })
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const limit = 50
  const messages = await prisma.message.findMany({
    where: { channelId, isDeleted: false, threadId: null },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true,
      reactions: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { replies: true } },
      poll: { include: { options: { include: { votes: true } } } },
    },
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  return NextResponse.json({ messages: messages.reverse(), nextCursor: hasMore ? messages[0]?.id : null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(session.user.id, 30, 60)
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })

  const body = await req.json() as { channelId: string; content: string }
  const { channelId, content } = body

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId } },
  })
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const message = await prisma.message.create({
    data: { content, authorId: session.user.id, channelId },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true, reactions: true,
    },
  })

  return NextResponse.json({ message }, { status: 201 })
}
