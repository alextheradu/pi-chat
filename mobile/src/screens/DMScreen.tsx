import { useState } from 'react'
import { useDMs } from '../hooks/useDMs'
import Avatar from '../components/Avatar'
import DMView from './DMView'

export default function DMScreen() {
  const { data: dms, isLoading } = useDMs()
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [activeName,  setActiveName]  = useState('')

  if (activeId) {
    return <DMView dmId={activeId} partnerName={activeName} onBack={() => setActiveId(null)} />
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Direct Messages</h1>
      </div>

      {isLoading && (
        <p style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      )}

      {dms?.map((dm) => (
        <button
          key={dm.id}
          onClick={() => { setActiveId(dm.id); setActiveName(dm.partnerName) }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
            textAlign: 'left',
          }}
        >
          <Avatar src={dm.partnerAvatar} name={dm.partnerName} size={40} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {dm.partnerName}
            </p>
            {dm.lastMessage && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {dm.lastMessage.slice(0, 60)}{dm.lastMessage.length > 60 ? '…' : ''}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
