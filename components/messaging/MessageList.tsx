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
