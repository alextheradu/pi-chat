import { useEffect, useRef } from 'react'
import Avatar from './Avatar'

type Message = {
  id: string
  content: string
  createdAt: string
  isDeleted: boolean
  author: { id: string; name: string; displayName?: string; avatarUrl?: string }
}

type Props = { messages: Message[] }

export default function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      {messages.filter((m) => !m.isDeleted).map((msg) => (
        <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Avatar
            src={msg.author.avatarUrl}
            name={msg.author.displayName ?? msg.author.name}
            size={32}
          />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {msg.author.displayName ?? msg.author.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.4 }}>
              {msg.content}
            </p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
