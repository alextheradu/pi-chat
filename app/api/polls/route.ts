import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pollId, optionId } = await req.json() as { pollId: string; optionId: string }
  const userId = session.user.id

  const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } })
  if (existing) {
    await prisma.pollVote.update({ where: { id: existing.id }, data: { optionId } })
  } else {
    await prisma.pollVote.create({ data: { pollId, optionId, userId } })
  }

  const options = await prisma.pollOption.findMany({ where: { pollId }, orderBy: { order: 'asc' }, include: { votes: true } })
  return NextResponse.json({ options })
}
