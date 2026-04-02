import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, displayName: true, avatarUrl: true, status: true, role: true },
  })
  if (!user) redirect('/login')

  const memberships = await prisma.channelMember.findMany({
    where: { userId: user.id },
    include: { channel: { include: { subdivision: true } } },
    orderBy: { channel: { name: 'asc' } },
  })

  const channels = memberships
    .filter((m) => !m.channel.isArchived)
    .map((m) => ({
      id: m.channel.id,
      name: m.channel.name,
      slug: m.channel.slug,
      description: m.channel.description,
      isPrivate: m.channel.isPrivate,
      isAnnouncement: m.channel.isAnnouncement,
      subdivisionId: m.channel.subdivisionId,
      subdivision: m.channel.subdivision,
    }))

  // Phase 3: populate DMs from DB
  const dms: never[] = []

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}
    >
      <Sidebar
        channels={channels}
        dms={dms}
        currentUser={{
          id: user.id,
          name: user.displayName ?? user.name,
          avatarUrl: user.avatarUrl,
          status: user.status,
          role: user.role,
        }}
      />
      <main
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
