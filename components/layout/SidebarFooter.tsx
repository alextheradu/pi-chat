'use client'

import Link from 'next/link'
import { Bell, Settings, ShieldCheck } from 'lucide-react'
import type { Role, UserStatus } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'

const STATUS_TEXT: Record<UserStatus, string> = {
  ONLINE:  'Online',
  AWAY:    'Away',
  DND:     'Do Not Disturb',
  OFFLINE: 'Offline',
}

interface SidebarFooterProps {
  userId: string
  name: string
  avatarUrl?: string | null
  status: UserStatus
  role: Role
}

export function SidebarFooter({ userId, name, avatarUrl, status, role }: SidebarFooterProps) {
  const canAccessAdmin = role === 'ADMIN' || role === 'MODERATOR'

  return (
    <div
      style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar userId={userId} name={name} avatarUrl={avatarUrl} size={30} />
        <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <PresenceDot status={status} size={8} borderColor="var(--bg-surface)" />
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {STATUS_TEXT[status]}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {[
          { Icon: Bell, label: 'Notifications' },
          { Icon: Settings, label: 'Settings' },
        ].map(({ Icon, label }) => (
          <button
            key={label}
            aria-label={label}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 6,
              color: 'var(--text-muted)',
            }}
          >
            <Icon size={15} />
          </button>
        ))}
        {canAccessAdmin && (
          <Link
            href="/admin"
            aria-label="Admin panel"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 6,
              color: 'var(--yellow)',
              textDecoration: 'none',
            }}
          >
            <ShieldCheck size={15} />
          </Link>
        )}
      </div>
    </div>
  )
}
