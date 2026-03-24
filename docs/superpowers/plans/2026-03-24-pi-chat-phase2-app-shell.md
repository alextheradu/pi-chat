# Pi-Chat Phase 2: App Shell, Sidebar & Channel Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full app shell — the three-column layout, sidebar with channels/DMs/footer, channel header, skeleton loaders, and routing — so every subsequent phase has a real home to slot into.

**Architecture:** Next.js App Router `(app)` route group with a shared layout. Sidebar is a client component with Zustand for collapse state. Channel/DM routing via `[id]` dynamic segments. Server components fetch initial data; client components handle real-time updates later (Phase 3).

**Tech Stack:** Next.js 15 App Router, React Server Components, Zustand, Framer Motion, lucide-react, Tailwind CSS v4, shadcn/ui, TanStack Query, Prisma

**Prerequisite:** Phase 1 complete (auth, DB, seed).

---

## File Map

| File | Purpose |
|------|---------|
| `app/(app)/layout.tsx` | Three-column shell: Sidebar + content + thread panel |
| `components/layout/Sidebar.tsx` | Full sidebar: team header, search, channels, DMs, footer |
| `components/layout/SidebarChannelItem.tsx` | Single channel row (icon, name, unread badge, active state) |
| `components/layout/SidebarDMItem.tsx` | Single DM row (avatar, presence, name, unread badge) |
| `components/layout/SidebarFooter.tsx` | Current user avatar, status, icon row |
| `components/layout/MobileNav.tsx` | Bottom nav bar (mobile only, 4 tabs) |
| `components/channels/ChannelHeader.tsx` | 48px header with icon, name, desc, action icons |
| `components/shared/UserAvatar.tsx` | Color-seeded initials avatar with optional image |
| `components/shared/PresenceDot.tsx` | 7px presence indicator dot |
| `components/shared/SkeletonMessage.tsx` | Shimmer skeleton for message loading state |
| `components/shared/SearchModal.tsx` | Global Cmd+K search (scaffold only, logic in Phase 4) |
| `store/app-store.ts` | Zustand global state (active channel, thread panel, sidebar) |
| `app/(app)/channel/[id]/page.tsx` | Channel view page (renders ChannelHeader + placeholder) |
| `app/(app)/dm/[id]/page.tsx` | DM view page |
| `app/(app)/tasks/page.tsx` | Tasks page placeholder |
| `app/(app)/search/page.tsx` | Search page placeholder |
| `app/api/channels/route.ts` | GET /api/channels — list user's channels |
| `app/api/channels/[id]/route.ts` | GET channel detail |

---

## Task 1: Zustand Global Store

**Files:**
- Create: `store/app-store.ts`

- [ ] **Step 1: Create `store/app-store.ts`**

```typescript
import { create } from 'zustand'

interface AppStore {
  // Active navigation
  activeChannelId: string | null
  activeDMId: string | null
  setActiveChannelId: (id: string | null) => void
  setActiveDMId: (id: string | null) => void

  // Thread panel
  threadParentId: string | null
  setThreadParentId: (id: string | null) => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Unread counts (channelId -> count)
  unreadCounts: Record<string, number>
  setUnreadCount: (channelId: string, count: number) => void
  clearUnread: (channelId: string) => void

  // Search modal
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeChannelId: null,
  activeDMId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  setActiveDMId: (id) => set({ activeDMId: id }),

  threadParentId: null,
  setThreadParentId: (id) => set({ threadParentId: id }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  unreadCounts: {},
  setUnreadCount: (channelId, count) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [channelId]: count } })),
  clearUnread: (channelId) =>
    set((s) => {
      const next = { ...s.unreadCounts }
      delete next[channelId]
      return { unreadCounts: next }
    }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add store/app-store.ts
git commit -m "feat: add Zustand global app store"
```

---

## Task 2: Shared Components (Avatar, Presence, Skeleton)

**Files:**
- Create: `components/shared/UserAvatar.tsx`
- Create: `components/shared/PresenceDot.tsx`
- Create: `components/shared/SkeletonMessage.tsx`

- [ ] **Step 1: Create `components/shared/UserAvatar.tsx`**

```typescript
import { useMemo } from 'react'

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444',
  '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
]

function getColorFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? '#6366f1'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
}

interface UserAvatarProps {
  userId: string
  name: string
  avatarUrl?: string | null
  size?: number
  className?: string
}

export function UserAvatar({ userId, name, avatarUrl, size = 32, className }: UserAvatarProps) {
  const color = useMemo(() => getColorFromId(userId), [userId])
  const initials = useMemo(() => getInitials(name), [name])

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      aria-label={name}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.375,
        fontWeight: 500,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/shared/PresenceDot.tsx`**

```typescript
import type { UserStatus } from '@prisma/client'

const STATUS_COLORS: Record<UserStatus, string> = {
  ONLINE:  'var(--online)',
  AWAY:    'var(--away)',
  DND:     'var(--dnd)',
  OFFLINE: 'var(--offline)',
}

interface PresenceDotProps {
  status: UserStatus
  size?: number
  borderColor?: string
}

export function PresenceDot({ status, size = 7, borderColor = 'var(--bg-surface)' }: PresenceDotProps) {
  return (
    <span
      aria-label={status.toLowerCase()}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status],
        border: `1px solid ${borderColor}`,
        flexShrink: 0,
      }}
    />
  )
}
```

- [ ] **Step 3: Create `components/shared/SkeletonMessage.tsx`**

```typescript
'use client'

export function SkeletonMessage() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '8px 16px',
        alignItems: 'flex-start',
      }}
    >
      <div className="skeleton-shimmer" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton-shimmer" style={{ width: 120, height: 10, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '85%', height: 10, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 10, borderRadius: 4 }} />
      </div>
    </div>
  )
}

export function SkeletonMessageList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonMessage key={i} />
      ))}
    </div>
  )
}
```

Add skeleton shimmer animation to `app/globals.css`:

```css
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    var(--bg-hover)    50%,
    var(--bg-elevated) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}
```

- [ ] **Step 4: Commit**

```bash
git add components/shared/
git commit -m "feat: add UserAvatar, PresenceDot, and SkeletonMessage shared components"
```

---

## Task 3: Channels API Route

**Files:**
- Create: `app/api/channels/route.ts`

- [ ] **Step 1: Create `app/api/channels/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.channelMember.findMany({
    where: { userId: session.user.id },
    include: {
      channel: {
        include: { subdivision: true },
      },
    },
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
      lastReadAt: m.lastReadAt,
      isMuted: m.isMuted,
    }))

  return NextResponse.json({ channels })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/channels/
git commit -m "feat: add GET /api/channels for current user's channel memberships"
```

---

## Task 4: Sidebar Components

**Files:**
- Create: `components/layout/SidebarChannelItem.tsx`
- Create: `components/layout/SidebarDMItem.tsx`
- Create: `components/layout/SidebarFooter.tsx`
- Create: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Create `components/layout/SidebarChannelItem.tsx`**

```typescript
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
  id, name, isPrivate, isAnnouncement, unreadCount = 0,
}: SidebarChannelItemProps) {
  const activeChannelId = useAppStore(s => s.activeChannelId)
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
        borderLeft: isActive ? '3px solid var(--yellow)' : '3px solid transparent',
        transition: 'background 80ms ease, color 80ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <Icon size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      {unreadCount > 0 && (
        <span style={{
          background: 'var(--yellow)',
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 10,
          minWidth: 16,
          textAlign: 'center',
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/layout/SidebarDMItem.tsx`**

```typescript
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

export function SidebarDMItem({ id, userId, name, avatarUrl, status, unreadCount = 0 }: SidebarDMItemProps) {
  const activeDMId = useAppStore(s => s.activeDMId)
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
        borderLeft: isActive ? '3px solid var(--yellow)' : '3px solid transparent',
        transition: 'background 80ms ease',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar userId={userId} name={name} avatarUrl={avatarUrl} size={28} />
        <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <PresenceDot status={status} size={7} />
        </span>
      </div>
      <span style={{
        flex: 1,
        fontSize: 13,
        fontFamily: 'var(--font-sans)',
        color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {name}
      </span>
      {unreadCount > 0 && (
        <span style={{
          background: 'var(--yellow)',
          color: 'var(--text-inverse)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: 10,
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
```

- [ ] **Step 3: Create `components/layout/SidebarFooter.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { Bell, Settings, ShieldCheck } from 'lucide-react'
import type { Role, UserStatus } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'

const STATUS_TEXT: Record<UserStatus, string> = {
  ONLINE: 'Online',
  AWAY: 'Away',
  DND: 'Do Not Disturb',
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
    <div style={{
      padding: '8px 12px',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <UserAvatar userId={userId} name={name} avatarUrl={avatarUrl} size={32} />
        <span style={{ position: 'absolute', bottom: -1, right: -1 }}>
          <PresenceDot status={status} size={8} borderColor="var(--bg-surface)" />
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {STATUS_TEXT[status]}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <button
          aria-label="Notifications"
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
        >
          <Bell size={16} />
        </button>
        <button
          aria-label="Settings"
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
        >
          <Settings size={16} />
        </button>
        {canAccessAdmin && (
          <Link
            href="/admin"
            aria-label="Admin panel"
            style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            <ShieldCheck size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/layout/Sidebar.tsx`** (main sidebar)

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import type { Role, UserStatus } from '@prisma/client'
import { SidebarChannelItem } from './SidebarChannelItem'
import { SidebarDMItem } from './SidebarDMItem'
import { SidebarFooter } from './SidebarFooter'
import { useAppStore } from '@/store/app-store'

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
  const setSearchOpen = useAppStore(s => s.setSearchOpen)
  const unreadCounts = useAppStore(s => s.unreadCounts)

  // Group channels by subdivision
  const ungrouped = channels.filter(c => !c.subdivisionId)
  const grouped = channels
    .filter(c => c.subdivisionId)
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
    setCollapsedSubs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const canCreateChannel = currentUser.role === 'ADMIN' || currentUser.role === 'MODERATOR'

  return (
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
      {/* Team Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--yellow)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-inverse)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, flexShrink: 0,
          }}>
            π
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Pi-oneers</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Team 1676</div>
          </div>
        </div>
        {/* Search bar */}
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Search (Cmd+K)"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <Search size={14} />
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Search...</span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'var(--bg-hover)', padding: '1px 4px', borderRadius: 4 }}>⌘K</span>
        </button>
      </div>

      {/* Scrollable channel/DM list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>

        {/* Channels section */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 8px', marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Channels
            </span>
            {canCreateChannel && (
              <button
                aria-label="Create channel"
                style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Ungrouped channels */}
          {ungrouped.map(ch => (
            <SidebarChannelItem
              key={ch.id}
              id={ch.id}
              name={ch.name}
              isPrivate={ch.isPrivate}
              isAnnouncement={ch.isAnnouncement}
              unreadCount={unreadCounts[ch.id] ?? 0}
            />
          ))}

          {/* Subdivision groups */}
          {Object.values(grouped).map(({ sub, channels: subChannels }) => (
            <div key={sub.id}>
              <button
                onClick={() => toggleSub(sub.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                  background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 6,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sub.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', flex: 1, textAlign: 'left' }}>
                  {sub.displayName}
                </span>
                {collapsedSubs.has(sub.id)
                  ? <ChevronRight size={12} color="var(--text-muted)" />
                  : <ChevronDown size={12} color="var(--text-muted)" />}
              </button>
              {!collapsedSubs.has(sub.id) && subChannels.map(ch => (
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

        {/* DMs section */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 8px', marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Direct Messages
            </span>
            <button
              aria-label="New direct message"
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}
            >
              <Plus size={14} />
            </button>
          </div>
          {dms.map(dm => (
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

      {/* Footer */}
      <SidebarFooter
        userId={currentUser.id}
        name={currentUser.name}
        avatarUrl={currentUser.avatarUrl}
        status={currentUser.status}
        role={currentUser.role}
      />
    </nav>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/layout/
git commit -m "feat: add Sidebar, SidebarChannelItem, SidebarDMItem, SidebarFooter components"
```

---

## Task 5: Channel Header

**Files:**
- Create: `components/channels/ChannelHeader.tsx`

- [ ] **Step 1: Create `components/channels/ChannelHeader.tsx`**

```typescript
'use client'

import { Hash, Lock, Megaphone, Pin, Search, Users, Settings } from 'lucide-react'
import type { Role } from '@prisma/client'

interface ChannelHeaderProps {
  name: string
  description?: string | null
  isPrivate: boolean
  isAnnouncement: boolean
  currentUserRole: Role
}

export function ChannelHeader({ name, description, isPrivate, isAnnouncement, currentUserRole }: ChannelHeaderProps) {
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
      <Icon size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', flexShrink: 0 }}>
        {name}
      </span>
      {description && (
        <>
          <div style={{ width: 1, height: 20, background: 'var(--border-default)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {description}
          </span>
        </>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
        {[
          { icon: Pin, label: 'Pinned messages' },
          { icon: Search, label: 'Search in channel' },
          { icon: Users, label: 'Member list' },
        ].map(({ icon: IconComp, label }) => (
          <button
            key={label}
            aria-label={label}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
          >
            <IconComp size={16} />
          </button>
        ))}
        {canManage && (
          <button
            aria-label="Channel settings"
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: 'var(--text-muted)' }}
          >
            <Settings size={16} />
          </button>
        )}
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/channels/ChannelHeader.tsx
git commit -m "feat: add ChannelHeader component"
```

---

## Task 6: App Layout & Route Pages

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `app/(app)/channel/[id]/page.tsx`
- Create: `app/(app)/dm/[id]/page.tsx`
- Create: `app/(app)/tasks/page.tsx`
- Create: `app/(app)/search/page.tsx`

- [ ] **Step 1: Create `app/(app)/layout.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, displayName: true, avatarUrl: true, status: true, role: true },
  })
  if (!user) redirect('/login')

  // Fetch user's channels
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

  // TODO Phase 3: fetch DMs
  const dms: never[] = []

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>
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
    </div>
  )
}
```

- [ ] **Step 2: Create `app/(app)/channel/[id]/page.tsx`**

```typescript
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ChannelHeader } from '@/components/channels/ChannelHeader'
import { SkeletonMessageList } from '@/components/shared/SkeletonMessage'

interface ChannelPageProps {
  params: Promise<{ id: string }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const channel = await prisma.channel.findUnique({
    where: { id },
    include: { subdivision: true },
  })
  if (!channel) notFound()

  // Check membership
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
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {/* Phase 3: MessageList goes here */}
        <SkeletonMessageList />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create placeholder pages**

`app/(app)/dm/[id]/page.tsx`:
```typescript
export default function DMPage() {
  return <div style={{ padding: 24, color: 'var(--text-muted)' }}>DMs — Phase 4</div>
}
```

`app/(app)/tasks/page.tsx`:
```typescript
export default function TasksPage() {
  return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Tasks — Phase 6</div>
}
```

`app/(app)/search/page.tsx`:
```typescript
export default function SearchPage() {
  return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Search — Phase 4</div>
}
```

- [ ] **Step 4: Create a redirect from `/` to first channel**

`app/(app)/page.tsx`:
```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function AppHomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Redirect to the first channel (general)
  const membership = await prisma.channelMember.findFirst({
    where: { userId: session.user.id },
    include: { channel: true },
    orderBy: { channel: { name: 'asc' } },
  })

  if (membership) {
    redirect(`/channel/${membership.channel.id}`)
  }

  return <div style={{ padding: 24, color: 'var(--text-muted)' }}>No channels available.</div>
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/
git commit -m "feat: add app shell layout, channel page, DM/tasks/search placeholder pages"
```

---

## Task 7: Mobile Nav

**Files:**
- Create: `components/layout/MobileNav.tsx`

- [ ] **Step 1: Create `components/layout/MobileNav.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, CheckSquare, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',       icon: Home,          label: 'Home' },
  { href: '/dm',     icon: MessageSquare, label: 'Messages' },
  { href: '/tasks',  icon: CheckSquare,   label: 'Tasks' },
  { href: '/profile',icon: User,          label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      style={{
        display: 'none', // shown via media query in globals.css
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="mobile-nav"
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                textDecoration: 'none',
                color: isActive ? 'var(--yellow)' : 'var(--text-muted)',
                minHeight: 44,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

Add to `app/globals.css`:
```css
@media (max-width: 768px) {
  .mobile-nav {
    display: block !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/MobileNav.tsx
git commit -m "feat: add mobile bottom navigation bar"
```

---

## Phase 2 Completion Checklist

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] Signed-in user sees the sidebar with their channels on `http://localhost:3000`
- [ ] Clicking a channel navigates to `/channel/[id]` and shows the ChannelHeader with correct name
- [ ] Active channel shows yellow left border in sidebar
- [ ] Unread badges render (yellow pill, monospace font)
- [ ] Subdivision groups are collapsible with ChevronDown/Right
- [ ] Admin/Moderator user sees ShieldCheck icon in sidebar footer
- [ ] Skeleton message list visible before Phase 3 messaging is built
- [ ] Cmd+K triggers search open (modal scaffolded, no results yet)
