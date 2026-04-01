import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminInvitesPage() {
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: 'desc' },
    include: { invitedBy: { select: { name: true, displayName: true } } },
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', margin: 0 }}>Invites</h1>
        <button
          style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)' }}
          disabled
          title="Invite creation coming soon"
        >
          + Invite Someone
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 120px 100px 100px', padding: '8px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Email', 'Invited By', 'Role', 'Expires', 'Status'].map(col => (
            <div key={col} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{col}</div>
          ))}
        </div>

        {invites.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No invites created yet.</div>
        )}

        {invites.map(invite => {
          const isUsed = !!invite.usedAt
          const isExpired = !isUsed && invite.expiresAt < new Date()
          const status = isUsed ? 'USED' : isExpired ? 'EXPIRED' : 'PENDING'
          const statusColor = isUsed ? 'var(--text-muted)' : isExpired ? '#ef4444' : '#22c55e'
          const statusBg = isUsed ? 'var(--bg-elevated)' : isExpired ? 'transparent' : 'transparent'
          const statusBorder = isUsed ? 'var(--border-subtle)' : isExpired ? '#ef4444' : '#22c55e'

          return (
            <div
              key={invite.id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 120px 100px 100px', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}
            >
              <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{invite.email}</div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {invite.invitedBy.displayName ?? invite.invitedBy.name}
              </div>

              <div>
                <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {invite.role}
                </span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {invite.expiresAt.getFullYear() >= 2098
                  ? 'Never'
                  : formatDistanceToNow(invite.expiresAt, { addSuffix: true })}
              </div>

              <div>
                <span style={{ background: statusBg, color: statusColor, border: `1px solid ${statusBorder}`, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
