import { prisma } from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export default async function AdminOverviewPage() {
  const today = startOfDay(new Date())
  const [totalMembers, activeToday, totalChannels, messagesToday, pendingApprovals, recentAudit] = await Promise.all([
    prisma.user.count({ where: { isApproved: true, isBanned: false } }),
    prisma.user.count({ where: { lastSeenAt: { gte: today } } }),
    prisma.channel.count({ where: { isArchived: false } }),
    prisma.message.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { isApproved: false, isBanned: false } }),
    prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { actor: { select: { name: true, displayName: true } } } }),
  ])
  const stats = [
    { label: 'Total Members',     value: totalMembers },
    { label: 'Active Today',      value: activeToday },
    { label: 'Total Channels',    value: totalChannels },
    { label: 'Messages Today',    value: messagesToday },
    { label: 'Pending Approvals', value: pendingApprovals, highlight: pendingApprovals > 0 },
  ]
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 700, color: stat.highlight ? 'var(--yellow)' : 'var(--text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Recent Audit Log</h2>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {recentAudit.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)', flexShrink: 0 }}>{log.action}</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.actor.displayName ?? log.actor.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{new Date(log.createdAt).toLocaleString()}</span>
          </div>
        ))}
        {recentAudit.length === 0 && (
          <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No audit log entries yet.</div>
        )}
      </div>
    </div>
  )
}
