'use client'

import { useState } from 'react'
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Role, UserStatus } from '@prisma/client'
import { SidebarChannelItem } from './SidebarChannelItem'
import { SidebarDMItem } from './SidebarDMItem'
import { SidebarFooter } from './SidebarFooter'
import { useAppStore } from '@/store/app-store'
import { projectConfig } from '@/lib/project-config'

interface ChannelData {
  id: string
  name: string
  isPrivate: boolean
  isAnnouncement: boolean
  subdivisionId: string | null
  subdivision: { id: string; name: string; displayName: string; color: string } | null
}

interface DMData {
  id: string
  userId: string
  name: string
  avatarUrl: string | null
  status: UserStatus
  unreadCount: number
}

interface SidebarProps {
  channels: ChannelData[]
  dms: DMData[]
  currentUser: {
    id: string
    name: string
    avatarUrl: string | null
    status: UserStatus
    role: Role
  }
}

export function Sidebar({ channels, dms, currentUser }: SidebarProps) {
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const unreadCounts = useAppStore((s) => s.unreadCounts)

  const ungrouped = channels.filter((c) => !c.subdivisionId)
  const grouped = channels
    .filter((c) => c.subdivisionId)
    .reduce<Record<string, { sub: NonNullable<ChannelData['subdivision']>; channels: ChannelData[] }>>(
      (acc, c) => {
        if (c.subdivision) {
          const key = c.subdivision.id
          if (!acc[key]) acc[key] = { sub: c.subdivision, channels: [] }
          acc[key]!.channels.push(c)
        }
        return acc
      },
      {}
    )

  const [collapsedSubs, setCollapsedSubs] = useState<Set<string>>(new Set())
  const toggleSub = (id: string) =>
    setCollapsedSubs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

  const canCreateChannel =
    currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR'

  return (
    <>
      <nav
        role="navigation"
        aria-label="Sidebar"
        style={{
          width: 232,
          flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Team header */}
        <div
          style={{
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: 'var(--yellow)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-inverse)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              π
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                {projectConfig.teamMemberPlural}
              </div>
              <div
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}
              >
                {projectConfig.teamName}
              </div>
            </div>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search (Cmd+K)"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '5px 8px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <Search size={13} />
            <span
              style={{
                flex: 1,
                textAlign: 'left',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                color: 'var(--text-muted)',
              }}
            >
              Search…
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-hover)',
                padding: '1px 4px',
                borderRadius: 4,
              }}
            >
              ⌘K
            </span>
          </button>
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 0' }}>
          {/* Channels */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 8px',
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Channels
              </span>
              {canCreateChannel && (
                <button
                  aria-label="Create channel"
                  style={{
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: 4,
                    color: 'var(--text-muted)',
                  }}
                >
                  <Plus size={13} />
                </button>
              )}
            </div>

            {ungrouped.map((ch) => (
              <SidebarChannelItem
                key={ch.id}
                id={ch.id}
                name={ch.name}
                isPrivate={ch.isPrivate}
                isAnnouncement={ch.isAnnouncement}
                unreadCount={unreadCounts[ch.id] ?? 0}
              />
            ))}

            {Object.values(grouped).map(({ sub, channels: subChannels }) => (
              <div key={sub.id}>
                <button
                  onClick={() => toggleSub(sub.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: sub.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      flex: 1,
                      textAlign: 'left',
                    }}
                  >
                    {sub.displayName}
                  </span>
                  {collapsedSubs.has(sub.id) ? (
                    <ChevronRight size={11} color="var(--text-muted)" />
                  ) : (
                    <ChevronDown size={11} color="var(--text-muted)" />
                  )}
                </button>
                {!collapsedSubs.has(sub.id) &&
                  subChannels.map((ch) => (
                    <SidebarChannelItem
                      key={ch.id}
                      id={ch.id}
                      name={ch.name}
                      isPrivate={ch.isPrivate}
                      isAnnouncement={ch.isAnnouncement}
                      unreadCount={unreadCounts[ch.id] ?? 0}
                    />
                  ))}
              </div>
            ))}
          </div>

          {/* DMs */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '2px 8px',
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                Direct Messages
              </span>
              <button
                aria-label="New direct message"
                style={{
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 4,
                  color: 'var(--text-muted)',
                }}
              >
                <Plus size={13} />
              </button>
            </div>
            {dms.map((dm) => (
              <SidebarDMItem
                key={dm.id}
                id={dm.id}
                userId={dm.userId}
                name={dm.name}
                avatarUrl={dm.avatarUrl}
                status={dm.status}
                unreadCount={dm.unreadCount}
              />
            ))}
          </div>
        </div>

        <SidebarFooter
          userId={currentUser.id}
          name={currentUser.name}
          avatarUrl={currentUser.avatarUrl}
          status={currentUser.status}
          role={currentUser.role}
        />
      </nav>
    </>
  )
}
