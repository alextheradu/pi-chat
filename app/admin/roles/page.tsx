import { PERMISSIONS } from '@/lib/permissions'
import type { Role } from '@prisma/client'

const ROLES: Role[] = ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST']

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'var(--yellow)',
  MODERATOR: 'var(--text-secondary)',
  SUBDIVISION_LEAD: '#22c55e',
  MEMBER: 'var(--text-muted)',
  GUEST: 'var(--text-muted)',
}

export default function AdminRolesPage() {
  const permissionEntries = Object.entries(PERMISSIONS) as [keyof typeof PERMISSIONS, readonly Role[]][]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Roles &amp; Permissions</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontFamily: 'var(--font-sans)' }}>
        Pi-Chat uses five roles: <strong style={{ color: 'var(--yellow)' }}>Admin</strong>,{' '}
        <strong style={{ color: 'var(--text-secondary)' }}>Moderator</strong>,{' '}
        <strong style={{ color: '#22c55e' }}>Subdivision Lead</strong>,{' '}
        <strong style={{ color: 'var(--text-muted)' }}>Member</strong>, and{' '}
        <strong style={{ color: 'var(--text-muted)' }}>Guest</strong>.
        Role assignments can be changed from the{' '}
        <a href="/admin/members" style={{ color: 'var(--yellow)', textDecoration: 'none' }}>Members</a> page.
        The matrix below is read-only and reflects the current permission configuration.
      </p>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, 80px)', padding: '8px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)', minWidth: 620 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Permission</div>
          {ROLES.map(role => (
            <div key={role} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: ROLE_COLORS[role], textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center' }}>
              {role === 'SUBDIVISION_LEAD' ? 'SUB.LEAD' : role}
            </div>
          ))}
        </div>

        {permissionEntries.map(([permission, allowedRoles]) => (
          <div
            key={permission}
            style={{ display: 'grid', gridTemplateColumns: '220px repeat(5, 80px)', padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', alignItems: 'center', minWidth: 620 }}
          >
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{permission}</div>
            {ROLES.map(role => (
              <div key={role} style={{ textAlign: 'center' }}>
                {(allowedRoles as readonly string[]).includes(role) ? (
                  <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                ) : (
                  <span style={{ color: 'var(--border-default)', fontSize: 12 }}>—</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
