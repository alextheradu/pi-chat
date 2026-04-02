import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'
import { DMView } from './DMView'

interface DMPageProps { params: Promise<{ id: string }> }

export default async function DMPage({ params }: DMPageProps) {
  const { id: otherUserId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { id: true, name: true, displayName: true, avatarUrl: true, status: true },
  })
  if (!otherUser) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', gap: 10, background: 'var(--bg-base)', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <UserAvatar userId={otherUser.id} name={otherUser.displayName ?? otherUser.name} avatarUrl={otherUser.avatarUrl} size={28} />
          <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
            <PresenceDot status={otherUser.status} size={8} />
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
          {otherUser.displayName ?? otherUser.name}
        </span>
      </header>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DMView otherUserId={otherUser.id} displayName={otherUser.displayName ?? otherUser.name} />
      </div>
    </div>
  )
}
