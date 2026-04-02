import { prisma } from '@/lib/prisma'

export default async function AdminChannelsPage() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subdivision: true,
      _count: { select: { members: true, messages: true } },
    },
  })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Channels</h1>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 120px 1fr 80px 80px 100px', gap: 0, padding: '8px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Name', 'Type', 'Subdivision', 'Members', 'Messages', 'Status'].map(col => (
            <div key={col} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{col}</div>
          ))}
        </div>

        {channels.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No channels yet.</div>
        )}

        {channels.map(channel => {
          const type = channel.isAnnouncement ? 'Announcement' : channel.isPrivate ? 'Private' : 'Public'
          const typeBg = channel.isAnnouncement ? 'var(--yellow)' : channel.isPrivate ? 'var(--bg-elevated)' : 'transparent'
          const typeColor = channel.isAnnouncement ? 'var(--text-inverse)' : channel.isPrivate ? 'var(--text-secondary)' : 'var(--text-muted)'
          const typeBorder = channel.isAnnouncement ? 'none' : channel.isPrivate ? '1px solid var(--border-default)' : '1px solid var(--border-subtle)'

          return (
            <div
              key={channel.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 120px 1fr 80px 80px 100px', gap: 0, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>#{channel.name}</div>
                {channel.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{channel.description}</div>}
              </div>

              <div>
                <span style={{ background: typeBg, color: typeColor, border: typeBorder, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {type}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {channel.subdivision ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: channel.subdivision.color, flexShrink: 0 }} />
                    {channel.subdivision.displayName}
                  </span>
                ) : '—'}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{channel._count.members}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{channel._count.messages}</div>

              <div>
                <span style={{
                  background: channel.isArchived ? 'var(--bg-elevated)' : 'transparent',
                  color: channel.isArchived ? 'var(--text-muted)' : '#22c55e',
                  border: `1px solid ${channel.isArchived ? 'var(--border-subtle)' : '#22c55e'}`,
                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
                }}>
                  {channel.isArchived ? 'ARCHIVED' : 'ACTIVE'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
