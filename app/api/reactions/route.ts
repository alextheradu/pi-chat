import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId, emoji } = await req.json() as { messageId: string; emoji: string }
  const userId = session.user.id

  const existing = await prisma.reaction.findUnique({
    where: { emoji_messageId_userId: { emoji, messageId, userId } },
  })

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { emoji, messageId, userId } })
  }

  const reactions = await prisma.reaction.groupBy({
    by: ['emoji'],
    where: { messageId },
    _count: { emoji: true },
  })

  return NextResponse.json({ reactions })
}
