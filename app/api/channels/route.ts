import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memberships = await prisma.channelMember.findMany({
    where: { userId: session.user.id },
    include: { channel: { include: { subdivision: true } } },
    orderBy: { channel: { name: 'asc' } },
  })

  const channels = memberships
    .filter(m => !m.channel.isArchived)
    .map(m => ({
      id: m.channel.id,
      name: m.channel.name,
      slug: m.channel.slug,
      description: m.channel.description,
      isPrivate: m.channel.isPrivate,
      isAnnouncement: m.channel.isAnnouncement,
      subdivisionId: m.channel.subdivisionId,
      subdivision: m.channel.subdivision,
      lastReadAt: m.lastReadAt,
      isMuted: m.isMuted,
    }))

  return NextResponse.json({ channels })
}
