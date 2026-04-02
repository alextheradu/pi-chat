import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import { api } from '../lib/api'
import Avatar from '../components/Avatar'
import { useAuthStore } from '../store/auth'

type DM = {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender: { name: string; displayName?: string; avatarUrl?: string }
}

type Props = { dmId: string; partnerName: string; onBack: () => void }

export default function DMView({ dmId, partnerName, onBack }: Props) {
  const [messages, setMessages] = useState<DM[]>([])
  const [text, setText] = useState('')
  const { user } = useAuthStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.get<{ messages: DM[] }>(`/api/dm/${dmId}`)
      .then(({ data }) => {
        setMessages(data.messages)
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50)
      })
  }, [dmId])

  async function handleSend() {
    if (!text.trim()) return
    await api.post(`/api/dm/${dmId}`, { content: text.trim() })
    setText('')
    const { data } = await api.get<{ messages: DM[] }>(`/api/dm/${dmId}`)
    setMessages(data.messages)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        <button onClick={onBack} style={{ color: 'var(--yellow)', padding: 4 }}>
          <ChevronLeft size={22} />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{partnerName}</span>
      </div>

      <div
        style={{
          flex: 1, overflowY: 'auto', padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}
      >
        {messages.map((m) => {
          const isOwn = m.senderId === user?.id
          return (
            <div
              key={m.id}
              style={{
                display: 'flex', gap: 8,
                justifyContent: isOwn ? 'flex-end' : 'flex-start',
              }}
            >
              {!isOwn && (
                <Avatar
                  src={m.sender.avatarUrl}
                  name={m.sender.displayName ?? m.sender.name}
                  size={28}
                />
              )}
              <div
                style={{
                  background: isOwn ? 'var(--yellow)' : 'var(--bg-elevated)',
                  color: isOwn ? '#000' : 'var(--text-primary)',
                  padding: '8px 12px', borderRadius: 14,
                  maxWidth: '75%', fontSize: 14, lineHeight: 1.4,
                }}
              >
                {m.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          display: 'flex', gap: 8, padding: '8px 12px',
          paddingBottom: 'calc(8px + var(--safe-bottom))',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          style={{
            flex: 1, background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 20, padding: '10px 16px',
            color: 'var(--text-primary)', fontSize: 14,
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            background: 'var(--yellow)', color: '#000',
            borderRadius: 20, padding: '10px 14px',
            opacity: !text.trim() ? 0.4 : 1,
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
