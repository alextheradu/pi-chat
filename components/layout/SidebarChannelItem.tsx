'use client'

import Link from 'next/link'
import { Hash, Lock, Megaphone } from 'lucide-react'
import { useAppStore } from '@/store/app-store'

interface SidebarChannelItemProps {
  id: string
  name: string
  isPrivate: boolean
  isAnnouncement: boolean
  unreadCount?: number
}

export function SidebarChannelItem({
  id,
  name,
  isPrivate,
  isAnnouncement,
  unreadCount = 0,
}: SidebarChannelItemProps) {
  const activeChannelId = useAppStore((s) => s.activeChannelId)
  const isActive = activeChannelId === id
  const Icon = isAnnouncement ? Megaphone : isPrivate ? Lock : Hash

  return (
    <Link
      href={`/channel/${id}`}
      aria-current={isActive ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        textDecoration: 'none',
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--yellow)' : '2px solid transparent',
        transition: 'background 80ms ease, color 80ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <Icon size={14} style={{ flexShrink: 0, opacity: 0.65 }} />
      <span
        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
            minWidth: 16,
            textAlign: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
