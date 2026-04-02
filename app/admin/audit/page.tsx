import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { name: true, displayName: true } } },
  })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Audit Log</h1>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1.5fr 1fr 120px', padding: '8px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Action', 'Actor', 'Target', 'When'].map(col => (
            <div key={col} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{col}</div>
          ))}
        </div>

        {logs.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No audit log entries yet.</div>
        )}

        {logs.map(log => (
          <div
            key={log.id}
            style={{ display: 'grid', gridTemplateColumns: '180px 1.5fr 1fr 120px', padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center' }}
          >
            <div>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>
                {log.action}
              </span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {log.actor.displayName ?? log.actor.name}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {log.targetType && log.targetId
                ? `${log.targetType} · ${log.targetId.slice(0, 8)}…`
                : '—'}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
