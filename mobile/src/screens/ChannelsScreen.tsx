import { useState } from 'react'
import { useChannels } from '../hooks/useChannels'
import { Hash, Lock } from 'lucide-react'
import ChannelView from './ChannelView'

export default function ChannelsScreen() {
  const { data: channels, isLoading } = useChannels()
  const [activeId, setActiveId] = useState<string | null>(null)

  if (activeId) {
    const ch = channels?.find((c) => c.id === activeId)
    return (
      <ChannelView
        channelId={activeId}
        name={ch?.name ?? ''}
        onBack={() => setActiveId(null)}
      />
    )
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Channels</h1>
      </div>

      {isLoading && (
        <p style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      )}

      {channels?.map((ch) => (
        <button
          key={ch.id}
          onClick={() => setActiveId(ch.id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontSize: 15,
          }}
        >
          {ch.isPrivate
            ? <Lock size={16} color="var(--text-muted)" />
            : <Hash size={16} color="var(--text-muted)" />}
          {ch.name}
        </button>
      ))}
    </div>
  )
}
