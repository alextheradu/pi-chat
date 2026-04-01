import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ChannelHeader } from '@/components/channels/ChannelHeader'
import { MessageList } from '@/components/messaging/MessageList'
import { MessageComposer } from '@/components/messaging/MessageComposer'
import { TypingIndicator } from '@/components/messaging/TypingIndicator'

interface ChannelPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const channel = await prisma.channel.findUnique({ where: { id }, include: { subdivision: true } })
  if (!channel) notFound()

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId: id } },
  })
  if (!membership) notFound()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChannelHeader
        name={channel.name}
        description={channel.description}
        isPrivate={channel.isPrivate}
        isAnnouncement={channel.isAnnouncement}
        currentUserRole={session.user.role}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <MessageList
          channelId={id}
          currentUserId={session.user.id}
          currentUserRole={session.user.role}
          currentUserName={session.user.name ?? ''}
          onReply={() => {}}
        />
        <TypingIndicator typingText="" />
        <MessageComposer channelId={id} placeholder={`Message #${channel.name}...`} />
      </div>
    </div>
  )
}
