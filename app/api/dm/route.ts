import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allMessages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
      receiver: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
    },
  })

  // Deduplicate: keep only the latest message per conversation partner
  const seen = new Set<string>()
  const dms = allMessages.filter(msg => {
    const otherId = msg.senderId === session.user.id ? msg.receiverId : msg.senderId
    if (seen.has(otherId)) return false
    seen.add(otherId)
    return true
  })

  return NextResponse.json({ dms })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiverId, content } = await req.json() as { receiverId: string; content: string }
  const dm = await prisma.directMessage.create({
    data: { content, senderId: session.user.id, receiverId },
    include: { sender: { select: { id: true, name: true, displayName: true, avatarUrl: true } } },
  })
  return NextResponse.json({ dm }, { status: 201 })
}
