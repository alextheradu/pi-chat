'use client'

import Link from 'next/link'
import type { UserStatus } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'
import { useAppStore } from '@/store/app-store'

interface SidebarDMItemProps {
  id: string
  userId: string
  name: string
  avatarUrl?: string | null
  status: UserStatus
  unreadCount?: number
}

export function SidebarDMItem({
  id,
  userId,
  name,
  avatarUrl,
  status,
  unreadCount = 0,
}: SidebarDMItemProps) {
  const activeDMId = useAppStore((s) => s.activeDMId)
  const isActive = activeDMId === id

  return (
    <Link
      href={`/dm/${id}`}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        borderRadius: 6,
        textDecoration: 'none',
        cursor: 'pointer',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--yellow)' : '2px solid transparent',
        transition: 'background 80ms ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar userId={userId} name={name} avatarUrl={avatarUrl} size={26} />
        <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <PresenceDot status={status} size={7} />
        </span>
      </div>
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </span>
      {unreadCount > 0 && (
        <span
          style={{
            background: 'var(--yellow)',
            color: 'var(--text-inverse)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 10,
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
