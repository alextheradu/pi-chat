# Pi-Chat Phase 3: Real-Time Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full real-time messaging system — Socket.io server, MessageList with virtualization, MessageItem with rich content rendering (DOMPurify-sanitized), MessageComposer with Tiptap, TypingIndicator, and Reactions.

**Architecture:** A standalone Express + Socket.io server runs on port 3001 alongside Next.js on port 3000. Next.js uses REST for initial message load (cursor pagination via TanStack Query). Socket.io pushes all real-time events. The client socket singleton reconnects automatically and falls back to polling on disconnect.

**Security:** All user-generated HTML is sanitized with DOMPurify before rendering. The `dangerouslySetInnerHTML` prop is only ever called with DOMPurify-cleaned strings. Zero XSS risk from message content.

**Tech Stack:** Socket.io, Express, Next.js API routes, TanStack Query, Tiptap, DOMPurify, lowlight/highlight.js, Framer Motion, Zustand, lucide-react

**Prerequisite:** Phases 1 and 2 complete.

---

## File Map

| File | Purpose |
|------|---------|
| `server/socket-server.ts` | Standalone Express + Socket.io server (port 3001) |
| `lib/socket-client.ts` | Browser Socket.io singleton with auto-reconnect |
| `lib/sanitize.ts` | DOMPurify wrapper — **always use this, never raw dangerouslySetInnerHTML** |
| `lib/rate-limit.ts` | In-memory rate limiter (30 msg/min per user) |
| `hooks/useSocket.ts` | React hook wrapping socket connection |
| `hooks/useMessages.ts` | TanStack Query + socket integration for message list |
| `hooks/useTyping.ts` | Emit/receive typing indicators |
| `hooks/usePresence.ts` | Receive presence updates, update Zustand |
| `app/api/messages/route.ts` | GET (paginated) + POST new message |
| `app/api/messages/[id]/route.ts` | PATCH (edit), DELETE message |
| `app/api/reactions/route.ts` | POST /api/reactions (toggle) |
| `components/messaging/MessageList.tsx` | Virtualized message list with infinite scroll |
| `components/messaging/MessageItem.tsx` | Single message row with sanitized rich content |
| `components/messaging/MessageComposer.tsx` | Tiptap editor with toolbar, @mention, /poll |
| `components/messaging/TypingIndicator.tsx` | Animated typing dots |
| `components/messaging/MessageReactions.tsx` | Reaction pills with emoji picker |
| `components/messaging/PollCard.tsx` | Poll display with voting and real-time updates |
| `app/api/polls/route.ts` | POST create poll, POST vote |

---

## Task 1: Socket.io Server

**Files:**
- Create: `server/socket-server.ts`

- [ ] **Step 1: Install server dependencies**

```bash
npm install express socket.io @types/express concurrently
```

- [ ] **Step 2: Create `server/socket-server.ts`**

```typescript
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../lib/prisma'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Auth middleware
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie ?? ''
    const req = {
      headers: { cookie: cookieHeader },
      cookies: Object.fromEntries(
        cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
      ),
    } as Parameters<typeof getToken>[0]['req']

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
    if (!token?.userId) return next(new Error('Unauthorized'))

    const user = await prisma.user.findUnique({
      where: { id: token.userId as string },
      select: { id: true, role: true, isBanned: true },
    })
    if (!user || user.isBanned) return next(new Error('Unauthorized'))

    socket.data.userId = user.id
    socket.data.role = user.role
    next()
  } catch {
    next(new Error('Unauthorized'))
  }
})

io.on('connection', async (socket) => {
  const userId = socket.data.userId as string

  // Auto-join user's channels
  const memberships = await prisma.channelMember.findMany({ where: { userId }, select: { channelId: true } })
  for (const m of memberships) await socket.join(`channel:${m.channelId}`)
  await socket.join(`user:${userId}`)

  // Presence
  await prisma.user.update({ where: { id: userId }, data: { status: 'ONLINE', lastSeenAt: new Date() } })
  io.emit('presence:update', { userId, status: 'ONLINE' })

  socket.on('message:send', async (data: { channelId: string; content: string }) => {
    const { channelId, content } = data
    // Content will be further sanitized on the client before rendering
    const message = await prisma.message.create({
      data: { content, authorId: userId, channelId },
      include: {
        author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
        attachments: true, reactions: true,
      },
    })
    io.to(`channel:${channelId}`).emit('message:new', { message })
  })

  socket.on('message:edit', async (data: { messageId: string; content: string }) => {
    const msg = await prisma.message.findUnique({ where: { id: data.messageId } })
    if (!msg || (msg.authorId !== userId && !['ADMIN', 'MODERATOR'].includes(socket.data.role))) return
    await prisma.message.update({ where: { id: data.messageId }, data: { content: data.content, isEdited: true } })
    io.to(`channel:${msg.channelId}`).emit('message:edit', { messageId: data.messageId, content: data.content, editedAt: new Date() })
  })

  socket.on('message:delete', async (data: { messageId: string }) => {
    const msg = await prisma.message.findUnique({ where: { id: data.messageId } })
    if (!msg || (msg.authorId !== userId && !['ADMIN', 'MODERATOR'].includes(socket.data.role))) return
    await prisma.message.update({ where: { id: data.messageId }, data: { isDeleted: true } })
    io.to(`channel:${msg.channelId}`).emit('message:delete', { messageId: data.messageId })
  })

  socket.on('reaction:toggle', async (data: { messageId: string; emoji: string }) => {
    const { messageId, emoji } = data
    const msg = await prisma.message.findUnique({ where: { id: messageId } })
    if (!msg) return
    const existing = await prisma.reaction.findUnique({
      where: { emoji_messageId_userId: { emoji, messageId, userId } },
    })
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } })
    } else {
      await prisma.reaction.create({ data: { emoji, messageId, userId } })
    }
    const count = await prisma.reaction.count({ where: { messageId, emoji } })
    io.to(`channel:${msg.channelId}`).emit(existing ? 'reaction:remove' : 'reaction:add', { messageId, emoji, userId, count })
  })

  socket.on('typing:start', async ({ channelId }: { channelId: string }) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, name: true } })
    socket.to(`channel:${channelId}`).emit('typing:start', { userId, channelId, userName: user?.displayName ?? user?.name ?? '' })
  })

  socket.on('typing:stop', ({ channelId }: { channelId: string }) => {
    socket.to(`channel:${channelId}`).emit('typing:stop', { userId, channelId })
  })

  socket.on('presence:update', async ({ status }: { status: string }) => {
    await prisma.user.update({ where: { id: userId }, data: { status: status as 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE' } })
    io.emit('presence:update', { userId, status })
  })

  socket.on('dm:send', async ({ receiverId, content }: { receiverId: string; content: string }) => {
    const dm = await prisma.directMessage.create({
      data: { content, senderId: userId, receiverId },
      include: { sender: { select: { id: true, name: true, displayName: true, avatarUrl: true } } },
    })
    io.to(`user:${receiverId}`).emit('dm:new', { dm })
    socket.emit('dm:new', { dm })
  })

  socket.on('disconnect', async () => {
    await prisma.user.update({ where: { id: userId }, data: { status: 'OFFLINE', lastSeenAt: new Date() } })
    io.emit('presence:update', { userId, status: 'OFFLINE' })
  })
})

const PORT = parseInt(process.env.SOCKET_PORT ?? '3001')
httpServer.listen(PORT, () => console.log(`Socket.io server running on :${PORT}`))
```

- [ ] **Step 3: Create `tsconfig.server.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "target": "ES2020",
    "strict": true
  },
  "include": ["server/**/*", "lib/**/*"]
}
```

- [ ] **Step 4: Update `package.json` scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"next dev\" \"ts-node --project tsconfig.server.json server/socket-server.ts\"",
    "socket": "ts-node --project tsconfig.server.json server/socket-server.ts"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add server/ tsconfig.server.json package.json
git commit -m "feat: add Socket.io standalone server with auth middleware and all events"
```

---

## Task 2: HTML Sanitizer Utility (Security Foundation)

**Files:**
- Create: `lib/sanitize.ts`

This module is the **only** place in the app that should call DOMPurify. All message content must flow through `sanitizeMessageHtml()` before rendering.

- [ ] **Step 1: Create `lib/sanitize.ts`**

```typescript
// lib/sanitize.ts
// Central HTML sanitization utility for user-generated message content.
// ALL message HTML must pass through sanitizeMessageHtml() before rendering.
// Never pass raw user content to dangerouslySetInnerHTML directly.

let dompurify: ReturnType<typeof import('dompurify').default> | null = null

function getDOMPurify() {
  if (typeof window === 'undefined') {
    // Server-side: return plain text (messages are rendered client-only)
    return null
  }
  if (!dompurify) {
    const createDOMPurify = require('dompurify') as typeof import('dompurify')
    dompurify = createDOMPurify(window)
  }
  return dompurify
}

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 's', 'u', 'code', 'pre',
  'blockquote', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
  'span', 'div',
]

const ALLOWED_ATTRS = {
  'a': ['href', 'target', 'rel'],
  'code': ['class'],           // highlight.js language classes
  'pre': ['class'],
  'span': ['class', 'data-mention-id'],  // @mention spans
  '*': [],
}

/**
 * Sanitize user-generated HTML message content.
 * Safe to pass directly to dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(content) }}
 */
export function sanitizeMessageHtml(rawHtml: string): string {
  const purify = getDOMPurify()
  if (!purify) return '' // Server-side: skip rendering

  return purify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-mention-id'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    FORCE_BODY: true,
    ADD_ATTR: ['target'],
  })
}

/**
 * Highlight @username mentions in already-sanitized HTML.
 * Returns HTML with mention spans wrapped in yellow highlight.
 */
export function highlightMentions(sanitizedHtml: string, currentUsername?: string): string {
  return sanitizedHtml.replace(
    /@(\w+)/g,
    (match, username) => {
      const isSelf = currentUsername && username.toLowerCase() === currentUsername.toLowerCase()
      return `<span class="mention${isSelf ? ' mention-self' : ''}" data-mention-id="${username}">@${username}</span>`
    }
  )
}
```

Add mention styles to `app/globals.css`:

```css
.mention {
  background: var(--yellow-dim);
  color: var(--yellow);
  border-radius: 3px;
  padding: 0 3px;
  font-weight: 500;
}

.mention-self {
  background: var(--yellow-dim);
  color: var(--yellow);
  border-left: 2px solid var(--yellow);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sanitize.ts
git commit -m "feat: add DOMPurify-based HTML sanitization utility for message content"
```

---

## Task 3: Socket Client & Hooks

**Files:**
- Create: `lib/socket-client.ts`
- Create: `hooks/useSocket.ts`
- Create: `hooks/usePresence.ts`
- Create: `hooks/useTyping.ts`

- [ ] **Step 1: Create `lib/socket-client.ts`**

```typescript
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
```

- [ ] **Step 2: Create `hooks/useSocket.ts`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socket = getSocket()

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (socket.connected) setIsConnected(true)
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect) }
  }, [socket])

  return { socket, isConnected }
}
```

- [ ] **Step 3: Create `hooks/useTyping.ts`**

```typescript
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSocket } from './useSocket'

export function useTyping(channelId: string) {
  const { socket } = useSocket()
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  useEffect(() => {
    const onStart = ({ userId, userName, channelId: cid }: { userId: string; userName: string; channelId: string }) => {
      if (cid !== channelId) return
      setTypingUsers(prev => ({ ...prev, [userId]: userName }))
    }
    const onStop = ({ userId, channelId: cid }: { userId: string; channelId: string }) => {
      if (cid !== channelId) return
      setTypingUsers(prev => { const n = { ...prev }; delete n[userId]; return n })
    }
    socket.on('typing:start', onStart)
    socket.on('typing:stop', onStop)
    return () => { socket.off('typing:start', onStart); socket.off('typing:stop', onStop) }
  }, [socket, channelId])

  const startTyping = useCallback(() => {
    socket.emit('typing:start', { channelId })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { channelId }), 3000)
  }, [socket, channelId])

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    socket.emit('typing:stop', { channelId })
  }, [socket, channelId])

  const typingNames = Object.values(typingUsers)
  let typingText = ''
  if (typingNames.length === 1) typingText = `${typingNames[0]} is typing...`
  else if (typingNames.length === 2) typingText = `${typingNames[0]} and ${typingNames[1]} are typing...`
  else if (typingNames.length > 2) typingText = 'Several people are typing...'

  return { typingText, startTyping, stopTyping }
}
```

- [ ] **Step 4: Create `hooks/usePresence.ts`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import type { UserStatus } from '@prisma/client'

export function usePresence(initialStatuses: Record<string, UserStatus> = {}) {
  const { socket } = useSocket()
  const [statuses, setStatuses] = useState(initialStatuses)

  useEffect(() => {
    const handler = ({ userId, status }: { userId: string; status: UserStatus }) => {
      setStatuses(prev => ({ ...prev, [userId]: status }))
    }
    socket.on('presence:update', handler)
    return () => { socket.off('presence:update', handler) }
  }, [socket])

  return statuses
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/socket-client.ts hooks/
git commit -m "feat: add socket client, useSocket, useTyping, usePresence hooks"
```

---

## Task 4: Messages & Reactions API

**Files:**
- Create: `lib/rate-limit.ts`
- Create: `app/api/messages/route.ts`
- Create: `app/api/messages/[id]/route.ts`
- Create: `app/api/reactions/route.ts`

- [ ] **Step 1: Create `lib/rate-limit.ts`**

```typescript
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}
```

- [ ] **Step 2: Create `app/api/messages/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelId = req.nextUrl.searchParams.get('channelId')
  const cursor = req.nextUrl.searchParams.get('cursor') ?? undefined
  if (!channelId) return NextResponse.json({ error: 'channelId required' }, { status: 400 })

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId } },
  })
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const limit = 50
  const messages = await prisma.message.findMany({
    where: { channelId, isDeleted: false, threadId: null },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true,
      reactions: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { replies: true } },
      poll: { include: { options: { include: { votes: true } } } },
      linkPreviews: true,
    },
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  return NextResponse.json({ messages: messages.reverse(), nextCursor: hasMore ? messages[0]?.id : null })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(session.user.id, 30, 60)
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } })

  const body = await req.json() as { channelId: string; content: string }
  const { channelId, content } = body

  const membership = await prisma.channelMember.findUnique({
    where: { userId_channelId: { userId: session.user.id, channelId } },
  })
  if (!membership) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const message = await prisma.message.create({
    data: { content, authorId: session.user.id, channelId },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true, reactions: true,
    },
  })

  return NextResponse.json({ message }, { status: 201 })
}
```

- [ ] **Step 3: Create `app/api/reactions/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messageId, emoji } = await req.json() as { messageId: string; emoji: string }
  const userId = session.user.id

  const existing = await prisma.reaction.findUnique({
    where: { emoji_messageId_userId: { emoji, messageId, userId } },
  })

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { emoji, messageId, userId } })
  }

  const reactions = await prisma.reaction.groupBy({
    by: ['emoji'],
    where: { messageId },
    _count: { emoji: true },
  })

  return NextResponse.json({ reactions })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/messages/ app/api/reactions/ lib/rate-limit.ts
git commit -m "feat: add messages + reactions API with cursor pagination and rate limiting"
```

---

## Task 5: useMessages Hook & TanStack Query Provider

**Files:**
- Create: `hooks/useMessages.ts`
- Create: `components/providers/QueryProvider.tsx`

- [ ] **Step 1: Create `hooks/useMessages.ts`**

```typescript
'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSocket } from './useSocket'

export interface MessageAuthor {
  id: string; name: string; displayName: string | null; avatarUrl: string | null; role: string
}
export interface Message {
  id: string; content: string; authorId: string; channelId: string; threadId: string | null
  isEdited: boolean; isDeleted: boolean; createdAt: string; updatedAt: string
  author: MessageAuthor; attachments: unknown[]
  reactions: { emoji: string; userId: string }[]
  _count: { replies: number }
}

async function fetchMessages(channelId: string, cursor?: string) {
  const params = new URLSearchParams({ channelId })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/messages?${params}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json() as Promise<{ messages: Message[]; nextCursor: string | null }>
}

export function useMessages(channelId: string) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const query = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => fetchMessages(channelId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (firstPage) => firstPage.nextCursor ?? undefined,
  })

  useEffect(() => {
    const onNew = ({ message }: { message: Message }) => {
      if (message.channelId !== channelId) return
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map((page, i) =>
          i === old.pages.length - 1 ? { ...page, messages: [...page.messages, message] } : page
        )
        return { ...old, pages }
      })
    }
    const onEdit = ({ messageId, content }: { messageId: string; content: string }) => {
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map(page => ({
          ...page,
          messages: page.messages.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m),
        }))
        return { ...old, pages }
      })
    }
    const onDelete = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map(page => ({
          ...page,
          messages: page.messages.filter(m => m.id !== messageId),
        }))
        return { ...old, pages }
      })
    }
    socket.on('message:new', onNew)
    socket.on('message:edit', onEdit)
    socket.on('message:delete', onDelete)
    return () => { socket.off('message:new', onNew); socket.off('message:edit', onEdit); socket.off('message:delete', onDelete) }
  }, [socket, channelId, queryClient])

  return {
    messages: query.data?.pages.flatMap(p => p.messages) ?? [],
    isLoading: query.isLoading,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  }
}
```

- [ ] **Step 2: Create `components/providers/QueryProvider.tsx`**

```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

Wrap in `app/layout.tsx` body: `<QueryProvider>{children}</QueryProvider>`

- [ ] **Step 3: Commit**

```bash
git add hooks/useMessages.ts components/providers/
git commit -m "feat: add useMessages hook with TanStack Query + socket real-time updates"
```

---

## Task 6: MessageItem Component

**Files:**
- Create: `components/messaging/MessageReactions.tsx`
- Create: `components/messaging/MessageItem.tsx`

- [ ] **Step 1: Create `components/messaging/MessageReactions.tsx`**

```typescript
'use client'
import { Smile } from 'lucide-react'

interface Reaction { emoji: string; count: number; hasReacted: boolean }
interface MessageReactionsProps { reactions: Reaction[]; onReact: (emoji: string) => void }

export function MessageReactions({ reactions, onReact }: MessageReactionsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, alignItems: 'center' }}>
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          aria-label={`React with ${r.emoji} (${r.count})`}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: r.hasReacted ? 'var(--yellow-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${r.hasReacted ? 'var(--yellow-border)' : 'var(--border-default)'}`,
            borderRadius: 10, padding: '2px 6px', cursor: 'pointer', fontSize: 13,
          }}
        >
          <span>{r.emoji}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.count}</span>
        </button>
      ))}
      <button aria-label="Add reaction" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6 }}>
        <Smile size={14} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/messaging/MessageItem.tsx`**

Note: All HTML from messages is routed through `sanitizeMessageHtml()` from `lib/sanitize.ts` before rendering. The `safeHtml` variable passed to `__html` is always DOMPurify-cleaned.

```typescript
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import { Smile, Reply, Pin, Pencil, Trash2 } from 'lucide-react'
import type { Role } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { MessageReactions } from './MessageReactions'
import { sanitizeMessageHtml, highlightMentions } from '@/lib/sanitize'
import type { Message } from '@/hooks/useMessages'

interface MessageItemProps {
  message: Message
  isGrouped: boolean
  currentUserId: string
  currentUserRole: Role
  currentUserName?: string
  onReply: (id: string) => void
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
}

const ROLE_BADGE: Partial<Record<Role, string>> = { ADMIN: 'ADMIN', MODERATOR: 'MOD', SUBDIVISION_LEAD: 'LEAD' }

export function MessageItem({ message, isGrouped, currentUserId, currentUserRole, currentUserName, onReply, onReact, onEdit, onDelete, onPin }: MessageItemProps) {
  const [hovered, setHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const isOwn = message.authorId === currentUserId
  const canDelete = isOwn || currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'
  const canPin = ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'].includes(currentUserRole)

  // Aggregate reactions
  const reactionMap = new Map<string, { count: number; hasReacted: boolean }>()
  for (const r of message.reactions) {
    const e = reactionMap.get(r.emoji) ?? { count: 0, hasReacted: false }
    reactionMap.set(r.emoji, { count: e.count + 1, hasReacted: e.hasReacted || r.userId === currentUserId })
  }
  const reactions = Array.from(reactionMap.entries()).map(([emoji, v]) => ({ emoji, ...v }))

  // Sanitize HTML content — always sanitize before rendering, never skip this step
  const safeHtml = highlightMentions(sanitizeMessageHtml(message.content), currentUserName)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 12, padding: isGrouped ? '2px 16px' : '8px 16px', position: 'relative' }}
    >
      <div style={{ width: 32, flexShrink: 0 }}>
        {!isGrouped && (
          <UserAvatar userId={message.author.id} name={message.author.displayName ?? message.author.name} avatarUrl={message.author.avatarUrl} size={32} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!isGrouped && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {message.author.displayName ?? message.author.name}
            </span>
            {ROLE_BADGE[message.author.role as Role] && (
              <span style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                {ROLE_BADGE[message.author.role as Role]}
              </span>
            )}
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
            {message.isEdited && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
          </div>
        )}
        {/* safeHtml is DOMPurify-sanitized output from lib/sanitize.ts */}
        <div
          style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {reactions.length > 0 && <MessageReactions reactions={reactions} onReact={(emoji) => onReact(message.id, emoji)} />}
      </div>

      {hovered && (
        <div style={{ position: 'absolute', top: 4, right: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '2px 4px', display: 'flex', gap: 2, zIndex: 10 }}>
          {[
            { icon: Smile, label: 'Add reaction', fn: () => {} },
            { icon: Reply, label: 'Reply in thread', fn: () => onReply(message.id) },
            ...(canPin ? [{ icon: Pin, label: 'Pin message', fn: () => onPin(message.id) }] : []),
            ...(isOwn ? [{ icon: Pencil, label: 'Edit message', fn: () => {} }] : []),
            ...(canDelete ? [{ icon: Trash2, label: 'Delete message', fn: () => onDelete(message.id) }] : []),
          ].map(({ icon: Icon, label, fn }) => (
            <button key={label} aria-label={label} onClick={fn} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/messaging/MessageItem.tsx components/messaging/MessageReactions.tsx
git commit -m "feat: add MessageItem with DOMPurify-sanitized content and MessageReactions"
```

---

## Task 7: MessageList

**Files:**
- Create: `components/messaging/MessageList.tsx`

- [ ] **Step 1: Create `components/messaging/MessageList.tsx`**

```typescript
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { format, isSameDay } from 'date-fns'
import { useMessages } from '@/hooks/useMessages'
import { MessageItem } from './MessageItem'
import { SkeletonMessageList } from '@/components/shared/SkeletonMessage'
import type { Role } from '@prisma/client'

interface MessageListProps {
  channelId: string
  currentUserId: string
  currentUserRole: Role
  currentUserName: string
  onReply: (messageId: string) => void
}

export function MessageList({ channelId, currentUserId, currentUserRole, currentUserName, onReply }: MessageListProps) {
  const { messages, isLoading, hasMore, loadMore, isLoadingMore } = useMessages(channelId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 100 && hasMore && !isLoadingMore) loadMore()
  }, [hasMore, isLoadingMore, loadMore])

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    await fetch('/api/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId, emoji }) })
  }, [])

  const handleDelete = useCallback(async (messageId: string) => {
    await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
  }, [])

  if (isLoading) return <SkeletonMessageList />

  return (
    <div role="log" aria-live="polite" aria-label="Messages" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onScroll={handleScroll}>
      {isLoadingMore && <SkeletonMessageList />}
      {messages.map((message, i) => {
        const prev = messages[i - 1]
        const showDateDivider = !prev || !isSameDay(new Date(message.createdAt), new Date(prev.createdAt))
        const isGrouped = !showDateDivider && !!prev &&
          prev.authorId === message.authorId &&
          new Date(message.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000

        return (
          <div key={message.id}>
            {showDateDivider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 4 }}>
                  {format(new Date(message.createdAt), 'MMMM d, yyyy')}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>
            )}
            <MessageItem
              message={message}
              isGrouped={isGrouped}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              currentUserName={currentUserName}
              onReply={onReply}
              onReact={handleReact}
              onEdit={() => {}}
              onDelete={handleDelete}
              onPin={() => {}}
            />
          </div>
        )
      })}
      <div ref={bottomRef} style={{ height: 8 }} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/messaging/MessageList.tsx
git commit -m "feat: add MessageList with date dividers, grouping, and infinite scroll"
```

---

## Task 8: MessageComposer & TypingIndicator

**Files:**
- Create: `components/messaging/TypingIndicator.tsx`
- Create: `components/messaging/MessageComposer.tsx`

- [ ] **Step 1: Create `components/messaging/TypingIndicator.tsx`**

```typescript
'use client'
import { useReducedMotion } from 'framer-motion'

export function TypingIndicator({ typingText }: { typingText: string }) {
  const reduce = useReducedMotion()
  if (!typingText) return <div style={{ height: 24 }} />
  return (
    <div style={{ height: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: reduce ? 'none' : `typing-dot 1s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{typingText}</span>
    </div>
  )
}
```

Add to `app/globals.css`:
```css
@keyframes typing-dot {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
```

- [ ] **Step 2: Create `components/messaging/MessageComposer.tsx`**

```typescript
'use client'

import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { Bold as BoldExt } from '@tiptap/extension-bold'
import { Italic as ItalicExt } from '@tiptap/extension-italic'
import { Strike } from '@tiptap/extension-strike'
import { Code } from '@tiptap/extension-code'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Link as LinkExt } from '@tiptap/extension-link'
import { HardBreak } from '@tiptap/extension-hard-break'
import { History } from '@tiptap/extension-history'
import { Mention } from '@tiptap/extension-mention'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { createLowlight } from 'lowlight'
import java from 'highlight.js/lib/languages/java'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import { Bold, Italic, Code as CodeIcon, FileCode, Link, AtSign, Smile, Paperclip, Send } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useTyping } from '@/hooks/useTyping'

const lowlight = createLowlight()
lowlight.register({ java, python, typescript })

interface MessageComposerProps {
  channelId: string
  placeholder?: string
}

// Detect /poll [question] | [opt1] | [opt2] command
function parsePollCommand(text: string): { question: string; options: string[] } | null {
  const match = text.match(/^\/poll\s+(.+?)(?:\s*\|\s*(.+))+$/)
  if (!match) return null
  const parts = text.replace(/^\/poll\s+/, '').split('|').map(s => s.trim()).filter(Boolean)
  if (parts.length < 3) return null // question + at least 2 options
  return { question: parts[0]!, options: parts.slice(1) }
}

export function MessageComposer({ channelId, placeholder = 'Message...' }: MessageComposerProps) {
  const { socket } = useSocket()
  const { startTyping, stopTyping } = useTyping(channelId)

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      BoldExt,
      ItalicExt,
      Strike,
      Code,
      CodeBlockLowlight.configure({ lowlight }),
      LinkExt.configure({ openOnClick: false }),
      HardBreak.extend({
        addKeyboardShortcuts() {
          return {
            'Shift-Enter': () => this.editor.commands.setHardBreak(),
          }
        },
      }),
      History,
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          // Suggestion plugin — wire to user search in a future iteration
          items: async ({ query }: { query: string }) => {
            if (!query) return []
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=people`)
            const data = await res.json() as { people: { id: string; name: string; displayName: string | null }[] }
            return data.people.map(p => ({ id: p.id, label: p.displayName ?? p.name }))
          },
          render: () => {
            // Minimal suggestion renderer — a full popover can be built as an enhancement
            return {
              onStart: () => {},
              onUpdate: () => {},
              onKeyDown: () => false,
              onExit: () => {},
            }
          },
        },
      }),
    ],
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 44px; max-height: 200px; overflow-y: auto; font-size: 14px; color: var(--text-primary); padding: 8px 12px;',
        'data-placeholder': placeholder,
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          sendMessage()
          return true
        }
        return false
      },
    },
    onUpdate: () => startTyping(),
  })

  const sendMessage = useCallback(async () => {
    if (!editor) return
    const text = editor.getText()

    // Check for /poll command
    const poll = parsePollCommand(text)
    if (poll) {
      stopTyping()
      socket.emit('poll:create', { channelId, question: poll.question, options: poll.options })
      editor.commands.clearContent()
      return
    }

    const content = editor.getHTML()
    if (!content || content === '<p></p>') return
    stopTyping()
    socket.emit('message:send', { channelId, content })
    editor.commands.clearContent()
  }, [editor, socket, channelId, stopTyping])

  return (
    <div style={{ padding: '0 16px 12px' }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '6px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
          {[{ icon: Bold, label: 'Bold', cmd: () => editor?.chain().focus().toggleBold().run() },
            { icon: Italic, label: 'Italic', cmd: () => editor?.chain().focus().toggleItalic().run() },
            { icon: Code, label: 'Inline code', cmd: () => editor?.chain().focus().toggleCode().run() },
            { icon: FileCode, label: 'Code block', cmd: () => editor?.chain().focus().toggleCodeBlock().run() },
          ].map(({ icon: Icon, label, cmd }) => (
            <button key={label} aria-label={label} type="button" onClick={cmd} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />
          {[{ icon: AtSign, label: 'Mention' }, { icon: Smile, label: 'Emoji' }, { icon: Paperclip, label: 'Attach file' }].map(({ icon: Icon, label }) => (
            <button key={label} aria-label={label} type="button" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
        <EditorContent editor={editor} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 6px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag files here</span>
          <button aria-label="Send message" onClick={sendMessage} style={{ width: 28, height: 28, background: 'var(--yellow)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-inverse)' }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire into channel page — update `app/(app)/channel/[id]/page.tsx`**

Replace the SkeletonMessageList placeholder:
```typescript
import { MessageList } from '@/components/messaging/MessageList'
import { MessageComposer } from '@/components/messaging/MessageComposer'
import { TypingIndicator } from '@/components/messaging/TypingIndicator'

// Inside the return:
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
  <MessageList
    channelId={id}
    currentUserId={session.user.id}
    currentUserRole={session.user.role}
    currentUserName={session.user.name}
    onReply={() => {}}
  />
  <TypingIndicator typingText="" />
  <MessageComposer channelId={id} placeholder={`Message #${channel.name}...`} />
</div>
```

- [ ] **Step 4: Commit**

```bash
git add components/messaging/
git commit -m "feat: add TypingIndicator and MessageComposer with Tiptap editor"
```

---

---

## Task 9: Polls

**Files:**
- Create: `app/api/polls/route.ts`
- Create: `components/messaging/PollCard.tsx`

- [ ] **Step 1: Add `poll:create` socket event to socket server**

In `server/socket-server.ts`, add inside the `io.on('connection')` handler:

```typescript
socket.on('poll:create', async ({ channelId, question, options }: { channelId: string; question: string; options: string[] }) => {
  // Create the message first, then the poll attached to it
  const message = await prisma.message.create({
    data: { content: `📊 **${question}**`, authorId: userId, channelId },
    include: { author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } }, attachments: true, reactions: true },
  })
  await prisma.poll.create({
    data: {
      messageId: message.id,
      question,
      options: { create: options.map((text, order) => ({ text, order })) },
    },
  })
  const fullMessage = await prisma.message.findUnique({
    where: { id: message.id },
    include: {
      author: { select: { id: true, name: true, displayName: true, avatarUrl: true, role: true } },
      attachments: true, reactions: true,
      poll: { include: { options: { include: { votes: true }, orderBy: { order: 'asc' } } } },
    },
  })
  io.to(`channel:${channelId}`).emit('message:new', { message: fullMessage })
})

socket.on('poll:vote', async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
  const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } })
  if (existing) {
    await prisma.pollVote.update({ where: { id: existing.id }, data: { optionId } })
  } else {
    await prisma.pollVote.create({ data: { pollId, optionId, userId } })
  }
  const options = await prisma.pollOption.findMany({
    where: { pollId }, orderBy: { order: 'asc' },
    include: { votes: true },
  })
  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { message: { select: { channelId: true } } } })
  if (poll) {
    io.to(`channel:${poll.message.channelId}`).emit('poll:vote', { pollId, options })
  }
})
```

- [ ] **Step 2: Create `app/api/polls/route.ts`** (REST fallback for poll voting)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pollId, optionId } = await req.json() as { pollId: string; optionId: string }
  const userId = session.user.id

  const existing = await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId, userId } } })
  if (existing) {
    await prisma.pollVote.update({ where: { id: existing.id }, data: { optionId } })
  } else {
    await prisma.pollVote.create({ data: { pollId, optionId, userId } })
  }

  const options = await prisma.pollOption.findMany({
    where: { pollId }, orderBy: { order: 'asc' }, include: { votes: true },
  })

  return NextResponse.json({ options })
}
```

- [ ] **Step 3: Create `components/messaging/PollCard.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface PollOption { id: string; text: string; votes: { userId: string }[] }
interface PollCardProps {
  pollId: string
  question: string
  options: PollOption[]
  currentUserId: string
  isAnonymous: boolean
  endsAt: string | null
}

export function PollCard({ pollId, question, options, currentUserId, isAnonymous, endsAt }: PollCardProps) {
  const { socket } = useSocket()
  const [localOptions, setLocalOptions] = useState(options)

  const totalVotes = localOptions.reduce((sum, o) => sum + o.votes.length, 0)
  const userVotedOptionId = localOptions.find(o => o.votes.some(v => v.userId === currentUserId))?.id
  const maxVotes = Math.max(...localOptions.map(o => o.votes.length), 1)

  const vote = (optionId: string) => {
    socket.emit('poll:vote', { pollId, optionId })
    // Optimistic update
    setLocalOptions(prev => prev.map(o => {
      const wasVoted = o.id === userVotedOptionId
      const isNowVoted = o.id === optionId
      let votes = o.votes.filter(v => v.userId !== currentUserId)
      if (isNowVoted) votes = [...votes, { userId: currentUserId }]
      return { ...o, votes }
    }))
  }

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', maxWidth: 400, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <BarChart2 size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{question}</span>
      </div>
      {localOptions.map(opt => {
        const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
        const isLeader = opt.votes.length === maxVotes && opt.votes.length > 0
        const isVoted = opt.id === userVotedOptionId
        return (
          <button
            key={opt.id}
            onClick={() => vote(opt.id)}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: `1px solid ${isVoted ? 'var(--yellow-border)' : 'transparent'}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', marginBottom: 4, position: 'relative', overflow: 'hidden' }}
          >
            {/* Progress bar */}
            <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: isLeader ? 'rgba(245,197,24,0.3)' : 'var(--bg-hover)', borderRadius: 6, transition: 'width 200ms ease' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{opt.text}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {opt.votes.length} ({pct}%)
              </span>
            </div>
          </button>
        )
      })}
      <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {endsAt && ` · Ends ${new Date(endsAt).toLocaleDateString()}`}
        {isAnonymous && ' · Anonymous'}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Wire PollCard into MessageItem**

In `components/messaging/MessageItem.tsx`, after the sanitized content div, add:

```typescript
import { PollCard } from './PollCard'

// After the content div:
{(message as MessageWithPoll).poll && (
  <PollCard
    pollId={(message as MessageWithPoll).poll!.id}
    question={(message as MessageWithPoll).poll!.question}
    options={(message as MessageWithPoll).poll!.options}
    currentUserId={currentUserId}
    isAnonymous={(message as MessageWithPoll).poll!.isAnonymous}
    endsAt={(message as MessageWithPoll).poll?.endsAt ?? null}
  />
)}
```

Update the `Message` type in `hooks/useMessages.ts` to include the optional poll:
```typescript
poll?: {
  id: string
  question: string
  isAnonymous: boolean
  endsAt: string | null
  options: { id: string; text: string; votes: { userId: string }[] }[]
} | null
```

- [ ] **Step 5: Commit**

```bash
git add components/messaging/PollCard.tsx app/api/polls/ server/socket-server.ts hooks/useMessages.ts
git commit -m "feat: add polls with /poll slash command, PollCard, voting, and real-time updates"
```

---

## Phase 3 Completion Checklist

- [ ] Socket server starts on port 3001 (`npm run socket`)
- [ ] Sending a message appears in MessageList in real-time across two browser sessions
- [ ] Typing indicator appears when typing and clears after 3s idle or on send
- [ ] Reactions toggle correctly and persist on page reload
- [ ] Date dividers render between days
- [ ] Same-author consecutive messages within 5min are grouped (no repeated avatar)
- [ ] Infinite scroll upward loads older messages
- [ ] Rate limiter returns 429 after 30 msg/min
- [ ] All HTML rendered in MessageItem is DOMPurify-sanitized (verified in lib/sanitize.ts)
- [ ] `/poll Question | Option 1 | Option 2` creates a poll that renders in the channel
- [ ] Clicking a poll option updates the vote count in real-time across sessions
- [ ] `@mention` autocomplete queries `/api/search` and renders mention spans
- [ ] `Enter` sends, `Shift+Enter` inserts newline in composer
- [ ] `npm run build` succeeds with zero TypeScript errors
