'use client'

import { useAppStore } from '@/store/app-store'
import { MessageThread } from '@/components/messaging/MessageThread'
import type { Role } from '@prisma/client'

interface AppShellProps {
  children: React.ReactNode
  currentUserId: string
  currentUserRole: Role
  currentUserName: string
}

export function AppShell({ children, currentUserId, currentUserRole, currentUserName }: AppShellProps) {
  const { threadParentId, setThreadParentId } = useAppStore()

  // Get current channelId from URL — use a simple approach
  // (thread replies are sent to the current channel)
  const channelId = typeof window !== 'undefined'
    ? window.location.pathname.split('/channel/')[1]?.split('/')[0] ?? ''
    : ''

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
      {children}
      <MessageThread
        parentId={threadParentId}
        channelId={channelId}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        currentUserName={currentUserName}
        onClose={() => setThreadParentId(null)}
      />
    </div>
  )
}
