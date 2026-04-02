'use client'

import { Hash, Lock, Megaphone, Pin, Search, Settings, Users } from 'lucide-react'
import type { Role } from '@prisma/client'

interface ChannelHeaderProps {
  name: string
  description?: string | null
  isPrivate: boolean
  isAnnouncement: boolean
  currentUserRole: Role
}

export function ChannelHeader({
  name,
  description,
  isPrivate,
  isAnnouncement,
  currentUserRole,
}: ChannelHeaderProps) {
  const Icon = isAnnouncement ? Megaphone : isPrivate ? Lock : Hash
  const canManage = currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'

  return (
    <header
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-base)',
        gap: 8,
        flexShrink: 0,
      }}
    >
      <Icon size={15} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text-primary)',
          flexShrink: 0,
        }}
      >
        {name}
      </span>
      {description && (
        <>
          <div
            style={{
              width: 1,
              height: 18,
              background: 'var(--border-default)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {description}
          </span>
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
        {[
          { icon: Pin, label: 'Pinned messages' },
          { icon: Search, label: 'Search in channel' },
          { icon: Users, label: 'Member list' },
        ].map(({ icon: ActionIcon, label }) => (
          <button
            key={label}
            aria-label={label}
            style={{
              width: 30,
              height: 30,
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
            <ActionIcon size={15} />
          </button>
        ))}
        {canManage && (
          <button
            aria-label="Channel settings"
            style={{
              width: 30,
              height: 30,
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
            <Settings size={15} />
          </button>
        )}
      </div>
    </header>
  )
}
