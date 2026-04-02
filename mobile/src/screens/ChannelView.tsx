import { ChevronLeft } from 'lucide-react'
import { useMessages } from '../hooks/useMessages'
import MessageList from '../components/MessageList'
import MessageComposer from '../components/MessageComposer'

type Props = { channelId: string; name: string; onBack: () => void }

export default function ChannelView({ channelId, name, onBack }: Props) {
  const { data: messages = [], isLoading } = useMessages(channelId)

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
        <span style={{ fontSize: 16, fontWeight: 600 }}>#{name}</span>
      </div>

      {isLoading ? (
        <div
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading messages…</p>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}

      <MessageComposer channelId={channelId} />
    </div>
  )
}
