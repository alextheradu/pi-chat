# Pi-Chat Phase 4: DMs, Threads, Pinned Messages & Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build DM conversations (1-on-1 and group), the thread slide-in panel, pinned messages bar/drawer, and the global Cmd+K search modal.

**Architecture:** DMs and Threads reuse MessageList/Composer from Phase 3 with different data sources. Thread panel slides in from the right as a 320px panel (or full-screen on mobile). Search uses debounced fetch against a dedicated `/api/search` route that queries messages, channels, and users.

**Tech Stack:** Same as Phase 3 plus `@tiptap/*`, Framer Motion (thread slide-in), Zustand (thread state)

**Prerequisite:** Phase 3 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `app/(app)/dm/[id]/page.tsx` | DM conversation view (reuses MessageList/Composer) |
| `app/api/dm/route.ts` | GET DMs list, POST new DM |
| `app/api/dm/[id]/route.ts` | GET DM messages (paginated) |
| `app/api/messages/[id]/replies/route.ts` | GET thread replies |
| `app/api/search/route.ts` | GET /api/search?q=&type= |
| `app/api/pins/route.ts` | GET/POST/DELETE pinned messages |
| `components/messaging/MessageThread.tsx` | Thread slide-in panel |
| `components/messaging/PinnedBar.tsx` | Pinned message bar below channel header |
| `components/shared/SearchModal.tsx` | Full global search modal with Cmd+K |

---

## Task 1: DM API Routes

**Files:**
- Create: `app/api/dm/route.ts`
- Create: `app/api/dm/[id]/route.ts`

- [ ] **Step 1: Create `app/api/dm/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dms = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
    orderBy: { createdAt: 'desc' },
    distinct: ['senderId', 'receiverId'],
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
      receiver: { select: { id: true, name: true, displayName: true, avatarUrl: true, status: true } },
    },
  })

  return NextResponse.json({ dms })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiverId, content } = await req.json() as { receiverId: string; content: string }
  const dm = await prisma.directMessage.create({
    data: { content, senderId: session.user.id, receiverId },
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
    },
  })

  return NextResponse.json({ dm }, { status: 201 })
}
```

- [ ] **Step 2: Create `app/api/dm/[id]/route.ts`** (get DM messages between two users)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: otherUserId } = await params
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  const limit = 50

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id },
      ],
      isDeleted: false,
    },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true,
    },
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  return NextResponse.json({ messages: messages.reverse(), nextCursor: hasMore ? messages[0]?.id : null })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/dm/
git commit -m "feat: add DM API routes for listing and fetching messages"
```

---

## Task 2: DM Page

**Files:**
- Modify: `app/(app)/dm/[id]/page.tsx`

- [ ] **Step 1: Update `app/(app)/dm/[id]/page.tsx`**

```typescript
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MessageComposer } from '@/components/messaging/MessageComposer'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'

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

  const conversationId = [session.user.id, otherUserId].sort().join(':')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* DM Header */}
      <header style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', gap: 10 }}>
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
        {/* Phase 4: DM MessageList using conversationId */}
        <div style={{ flex: 1, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          DM history loading...
        </div>
        <MessageComposer channelId={conversationId} placeholder={`Message ${otherUser.displayName ?? otherUser.name}...`} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/dm/
git commit -m "feat: add DM page with user header and composer"
```

---

## Task 3: Thread Panel

**Files:**
- Create: `components/messaging/MessageThread.tsx`
- Create: `app/api/messages/[id]/replies/route.ts`

- [ ] **Step 1: Create `app/api/messages/[id]/replies/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: parentId } = await params
  const replies = await prisma.message.findMany({
    where: { threadId: parentId, isDeleted: false },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      reactions: true,
      attachments: true,
    },
  })

  const parent = await prisma.message.findUnique({
    where: { id: parentId },
    include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } } },
  })

  return NextResponse.json({ parent, replies })
}
```

- [ ] **Step 2: Create `components/messaging/MessageThread.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, MessageSquare } from 'lucide-react'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import type { Role } from '@prisma/client'
import type { Message } from '@/hooks/useMessages'

interface MessageThreadProps {
  parentId: string | null
  channelId: string
  currentUserId: string
  currentUserRole: Role
  currentUserName: string
  onClose: () => void
}

export function MessageThread({ parentId, channelId, currentUserId, currentUserRole, currentUserName, onClose }: MessageThreadProps) {
  const [replies, setReplies] = useState<Message[]>([])
  const [parent, setParent] = useState<Message | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!parentId) return
    fetch(`/api/messages/${parentId}/replies`)
      .then(r => r.json() as Promise<{ parent: Message; replies: Message[] }>)
      .then(data => { setParent(data.parent); setReplies(data.replies) })
      .catch(console.error)
  }, [parentId])

  return (
    <AnimatePresence>
      {parentId && (
        <motion.aside
          initial={shouldReduceMotion ? false : { x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            width: 320, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)',
          }}
        >
          <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', gap: 8 }}>
            <MessageSquare size={16} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>Thread</span>
            <button aria-label="Close thread" onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {parent && (
              <div style={{ padding: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                <MessageItem
                  message={parent}
                  isGrouped={false}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  currentUserName={currentUserName}
                  onReply={() => {}}
                  onReact={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onPin={() => {}}
                />
              </div>
            )}
            {replies.map(reply => (
              <MessageItem
                key={reply.id}
                message={reply}
                isGrouped={false}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                currentUserName={currentUserName}
                onReply={() => {}}
                onReact={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
                onPin={() => {}}
              />
            ))}
          </div>

          <MessageComposer channelId={channelId} placeholder="Reply in thread..." />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Wire thread panel into app layout**

In `app/(app)/layout.tsx`, add the thread panel to the right of main content using `threadParentId` from Zustand. The layout becomes: `Sidebar | main | MessageThread`.

- [ ] **Step 4: Commit**

```bash
git add components/messaging/MessageThread.tsx app/api/messages/
git commit -m "feat: add thread panel with slide-in animation and reply loading"
```

---

## Task 4: Pinned Messages

**Files:**
- Create: `app/api/pins/route.ts`
- Create: `components/messaging/PinnedBar.tsx`

- [ ] **Step 1: Create `app/api/pins/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = req.nextUrl.searchParams.get('channelId')
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  const pins = await prisma.pinnedMessage.findMany({
    where: { channelId },
    orderBy: { createdAt: 'desc' },
    include: { message: { include: { author: { select: { name: true, displayName: true } } } }, pinnedBy: { select: { name: true, displayName: true } } },
  })

  return NextResponse.json({ pins })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'message:pin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { messageId, channelId } = await req.json() as { messageId: string; channelId: string }
  const pin = await prisma.pinnedMessage.create({
    data: { messageId, channelId, pinnedById: session.user.id },
  })

  return NextResponse.json({ pin }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'message:pin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { messageId } = await req.json() as { messageId: string }
  await prisma.pinnedMessage.delete({ where: { messageId } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `components/messaging/PinnedBar.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Pin } from 'lucide-react'
import { sanitizeMessageHtml } from '@/lib/sanitize'

interface PinnedBarProps { channelId: string }

export function PinnedBar({ channelId }: PinnedBarProps) {
  const [latestPin, setLatestPin] = useState<{ message: { content: string } } | null>(null)

  useEffect(() => {
    fetch(`/api/pins?channelId=${channelId}`)
      .then(r => r.json() as Promise<{ pins: { message: { content: string } }[] }>)
      .then(data => setLatestPin(data.pins[0] ?? null))
      .catch(console.error)
  }, [channelId])

  if (!latestPin) return null

  // Strip HTML tags for the preview text using DOMPurify (sanitize to text only)
  const previewText = sanitizeMessageHtml(latestPin.message.content).replace(/<[^>]+>/g, '').slice(0, 80)

  return (
    <div style={{ background: 'var(--yellow-glow)', borderBottom: '1px solid var(--yellow-border)', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
      <Pin size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {previewText}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/pins/ components/messaging/PinnedBar.tsx
git commit -m "feat: add pinned messages API and PinnedBar component"
```

---

## Task 5: Global Search Modal

**Files:**
- Create: `app/api/search/route.ts`
- Create: `components/shared/SearchModal.tsx`

- [ ] **Step 1: Create `app/api/search/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? 'all'

  if (q.length < 2) return NextResponse.json({ messages: [], channels: [], people: [] })

  const [messages, channels, people] = await Promise.all([
    type === 'all' || type === 'messages'
      ? prisma.message.findMany({
          where: { content: { contains: q, mode: 'insensitive' }, isDeleted: false },
          take: 10,
          include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true } }, channel: { select: { id: true, name: true } } },
        })
      : [],
    type === 'all' || type === 'channels'
      ? prisma.channel.findMany({
          where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }], isArchived: false },
          take: 5,
        })
      : [],
    type === 'all' || type === 'people'
      ? prisma.user.findMany({
          where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { displayName: { contains: q, mode: 'insensitive' } }], isApproved: true, isBanned: false },
          take: 5,
          select: { id: true, name: true, displayName: true, avatarUrl: true, role: true, subdivisionMembers: { include: { subdivision: true } } },
        })
      : [],
  ])

  return NextResponse.json({ messages, channels, people })
}
```

- [ ] **Step 2: Create `components/shared/SearchModal.tsx`**

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, SearchX, Hash, Lock } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { UserAvatar } from './UserAvatar'

interface SearchResult {
  messages: { id: string; content: string; channel: { id: string; name: string }; author: { id: string; name: string; displayName: string | null; avatarUrl: string | null } }[]
  channels: { id: string; name: string; isPrivate: boolean; description: string | null }[]
  people: { id: string; name: string; displayName: string | null; avatarUrl: string | null; role: string }[]
}

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`)
      .then(r => r.json() as Promise<SearchResult>)
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const noResults = results && results.messages.length === 0 && results.channels.length === 0 && results.people.length === 0

  if (!searchOpen) return null

  return (
    <div
      role="dialog"
      aria-label="Search"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
      onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false) }}
    >
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search messages, channels, people..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          />
          <button aria-label="Close search" onClick={() => setSearchOpen(false)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 4 }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {noResults && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 8, color: 'var(--text-muted)' }}>
              <SearchX size={28} />
              <span style={{ fontSize: 13 }}>No results for "{query}"</span>
            </div>
          )}
          {results?.channels && results.channels.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Channels</div>
              {results.channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => { router.push(`/channel/${ch.id}`); setSearchOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  {ch.isPrivate ? <Lock size={14} color="var(--text-muted)" /> : <Hash size={14} color="var(--text-muted)" />}
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{ch.name}</div>
                    {ch.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {results?.people && results.people.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>People</div>
              {results.people.map(person => (
                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                  <UserAvatar userId={person.id} name={person.displayName ?? person.name} avatarUrl={person.avatarUrl} size={28} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{person.displayName ?? person.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Mount SearchModal in app layout**

In `app/(app)/layout.tsx`, add `<SearchModal />` at the end of the layout div.

- [ ] **Step 4: Commit**

```bash
git add app/api/search/ components/shared/SearchModal.tsx
git commit -m "feat: add search API and global Cmd+K search modal"
```

---

## Phase 4 Completion Checklist

- [ ] DM page shows correct user header and message composer
- [ ] Thread panel slides in from right when clicking Reply icon
- [ ] Thread panel shows parent message + replies, allows replying
- [ ] PinnedBar shows below ChannelHeader when pins exist
- [ ] Cmd+K opens search modal, Escape closes it
- [ ] Search results show channels, people, messages grouped by type
- [ ] No results state renders with SearchX icon
- [ ] `npm run build` passes with zero TypeScript errors
