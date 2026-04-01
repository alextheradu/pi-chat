import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? 'all'

  if (q.length < 2) return NextResponse.json({ messages: [], channels: [], people: [] })

  const [messages, channels, people] = await Promise.all([
    type === 'all' || type === 'messages'
      ? prisma.message.findMany({
          where: { content: { contains: q, mode: 'insensitive' }, isDeleted: false },
          take: 10,
          include: {
            author: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
            channel: { select: { id: true, name: true } },
          },
        })
      : [],
    type === 'all' || type === 'channels'
      ? prisma.channel.findMany({
          where: {
            OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
            isArchived: false,
          },
          take: 5,
        })
      : [],
    type === 'all' || type === 'people'
      ? prisma.user.findMany({
          where: {
            OR: [{ name: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }],
            isApproved: true, isBanned: false,
          },
          take: 5,
          select: { id: true, name: true, displayName: true, avatarUrl: true, role: true },
        })
      : [],
  ])

  return NextResponse.json({ messages, channels, people })
}
