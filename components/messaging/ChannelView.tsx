'use client'

import { useAppStore } from '@/store/app-store'
import { MessageList } from './MessageList'
import { MessageComposer } from './MessageComposer'
import { TypingIndicator } from './TypingIndicator'
import { useTyping } from '@/hooks/useTyping'
import type { Role } from '@prisma/client'

interface ChannelViewProps {
  channelId: string
  currentUserId: string
  currentUserRole: Role
  currentUserName: string
  channelName: string
}

export function ChannelView({ channelId, currentUserId, currentUserRole, currentUserName, channelName }: ChannelViewProps) {
  const setThreadParentId = useAppStore(s => s.setThreadParentId)
  const { typingText } = useTyping(channelId)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MessageList
        channelId={channelId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserName={currentUserName}
        onReply={setThreadParentId}
      />
      <TypingIndicator typingText={typingText} />
      <MessageComposer channelId={channelId} placeholder={`Message #${channelName}...`} />
    </div>
  )
}
