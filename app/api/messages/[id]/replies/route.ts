import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: parentId } = await params
  const replies = await prisma.message.findMany({
    where: { threadId: parentId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      reactions: true, attachments: true,
    },
  })

  const parent = await prisma.message.findUnique({
    where: { id: parentId },
    include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } } },
  })

  return NextResponse.json({ parent, replies })
}
