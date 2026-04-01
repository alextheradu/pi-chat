import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AppShell } from '@/components/layout/AppShell'
import { SearchModal } from '@/components/shared/SearchModal'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

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
    }))

  const dmsRaw = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
      receiver: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
    },
  })

  const seenDMs = new Set<string>()
  const dms = dmsRaw
    .filter(dm => {
      const otherId = dm.senderId === user.id ? dm.receiverId : dm.senderId
      if (seenDMs.has(otherId)) return false
      seenDMs.add(otherId)
      return true
    })
    .map(dm => {
      const otherUser = dm.senderId === user.id ? dm.receiver : dm.sender
      return {
        id: otherUser.id,
        userId: otherUser.id,
        name: otherUser.displayName ?? otherUser.name,
        avatarUrl: otherUser.avatarUrl,
        status: otherUser.status,
        unreadCount: 0,
      }
    })

  return (
    <AppShell currentUserId={user.id} currentUserRole={user.role} currentUserName={user.displayName ?? user.name}>
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
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {children}
      </main>
      <MobileNav />
      <SearchModal />
      <InstallPrompt />
    </AppShell>
  )
}
