import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AppHomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const membership = await prisma.channelMember.findFirst({
    where: { userId: session.user.id },
    include: { channel: true },
    orderBy: { channel: { name: 'asc' } },
  })

  if (membership) redirect(`/channel/${membership.channel.id}`)

  return <div style={{ padding: 24, color: 'var(--text-muted)' }}>No channels available.</div>
}
