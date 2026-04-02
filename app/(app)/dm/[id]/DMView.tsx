'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { MessageComposer } from '@/components/messaging/MessageComposer'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { sanitizeMessageHtml } from '@/lib/sanitize'

interface DMAuthor {
  id: string
  name: string
  displayName: string | null
  avatarUrl: string | null
  role: string
}

interface DMMessage {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: DMAuthor
}

interface DMResponse {
  messages: DMMessage[]
  nextCursor: string | null
}

interface DMViewProps {
  otherUserId: string
  displayName: string
}

export function DMView({ otherUserId, displayName }: DMViewProps) {
  const [messages, setMessages] = useState<DMMessage[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback((cursor?: string) => {
    const url = `/api/dm/${otherUserId}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`
    return fetch(url).then(r => r.json() as Promise<DMResponse>)
  }, [otherUserId])

  useEffect(() => {
    fetchMessages()
      .then(data => {
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [messages])

  const loadOlder = () => {
    if (!nextCursor) return
    fetchMessages(nextCursor).then(data => {
      setMessages(prev => [...data.messages, ...prev])
      setNextCursor(data.nextCursor)
    })
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            Loading...
          </div>
        )}
        {!loading && nextCursor && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <button
              onClick={loadOlder}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
            >
              Load older messages
            </button>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13 }}>
            No messages yet. Say hello to {displayName}!
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{ display: 'flex', gap: 10, padding: '4px 16px' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <UserAvatar userId={msg.sender.id} name={msg.sender.displayName ?? msg.sender.name} avatarUrl={msg.sender.avatarUrl} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                  {msg.sender.displayName ?? msg.sender.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {format(new Date(msg.createdAt), 'h:mm a')}
                </span>
              </div>
              {/* sanitizeMessageHtml uses DOMPurify — output is safe */}
              <div
                style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5, wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: sanitizeMessageHtml(msg.content) }}
              />
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageComposer dmUserId={otherUserId} placeholder={`Message ${displayName}...`} />
    </>
  )
}
