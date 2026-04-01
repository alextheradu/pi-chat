'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import type { Role, UserStatus } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'

interface SubdivisionMemberWithSub {
  id: string
  subdivision: {
    id: string
    name: string
    displayName: string
    color: string
  }
}

interface MemberRow {
  id: string
  name: string
  displayName: string | null
  email: string
  avatarUrl: string | null
  role: Role
  status: UserStatus
  isApproved: boolean
  isBanned: boolean
  createdAt: Date
  subdivisionMembers: SubdivisionMemberWithSub[]
}

interface MembersTableProps {
  members: MemberRow[]
}

const ROLE_OPTIONS: Role[] = ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST']

function roleBadgeStyle(role: Role): React.CSSProperties {
  if (role === 'ADMIN') {
    return { background: 'var(--yellow)', color: 'var(--text-inverse)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700 }
  }
  if (role === 'MODERATOR') {
    return { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }
  }
  return { background: 'var(--bg-elevated)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }
}

export function MembersTable({ members: initialMembers }: MembersTableProps) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.displayName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  async function patchMember(userId: string, payload: { action: string; role?: Role }) {
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload }),
    })
    if (!res.ok) {
      const data = await res.json() as { error?: string }
      alert(data.error ?? 'Action failed')
      return false
    }
    return true
  }

  function handleBan(member: MemberRow) {
    const action = member.isBanned ? 'unban' : 'ban'
    startTransition(async () => {
      const ok = await patchMember(member.id, { action })
      if (ok) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isBanned: !m.isBanned } : m))
    })
  }

  function handleApprove(member: MemberRow) {
    startTransition(async () => {
      const ok = await patchMember(member.id, { action: 'approve' })
      if (ok) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, isApproved: true } : m))
    })
  }

  function handleRoleChange(member: MemberRow, role: Role) {
    startTransition(async () => {
      const ok = await patchMember(member.id, { action: 'set_role', role })
      if (ok) setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role } : m))
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="search"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 6,
            padding: '7px 12px', color: 'var(--text-primary)', fontSize: 13, width: 280,
            fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        />
        <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 80px 110px 160px', gap: 0, padding: '8px 16px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Member', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(col => (
            <div key={col} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{col}</div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>No members found.</div>
        )}

        {filtered.map(member => (
          <div
            key={member.id}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 100px 80px 110px 160px', gap: 0,
              padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center', opacity: isPending ? 0.7 : 1,
            }}
          >
            {/* Member */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserAvatar userId={member.id} name={member.displayName ?? member.name} avatarUrl={member.avatarUrl} size={28} />
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{member.displayName ?? member.name}</div>
                {member.isBanned && <div style={{ fontSize: 10, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>BANNED</div>}
                {!member.isApproved && !member.isBanned && <div style={{ fontSize: 10, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>PENDING</div>}
              </div>
            </div>

            {/* Email */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>

            {/* Role */}
            <div>
              <span style={roleBadgeStyle(member.role)}>{member.role}</span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <PresenceDot status={member.status} size={8} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{member.status}</span>
            </div>

            {/* Joined */}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {/* Role select */}
              <select
                value={member.role}
                onChange={e => handleRoleChange(member, e.target.value as Role)}
                disabled={isPending}
                style={{
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 4,
                  padding: '3px 6px', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              {/* Approve */}
              {!member.isApproved && !member.isBanned && (
                <button
                  onClick={() => handleApprove(member)}
                  disabled={isPending}
                  style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                >
                  Approve
                </button>
              )}

              {/* Ban / Unban */}
              <button
                onClick={() => handleBan(member)}
                disabled={isPending}
                style={{
                  background: 'transparent',
                  color: member.isBanned ? 'var(--text-secondary)' : '#ef4444',
                  border: `1px solid ${member.isBanned ? 'var(--border-default)' : '#ef4444'}`,
                  borderRadius: 4, padding: '3px 8px', fontSize: 11, cursor: 'pointer',
                }}
              >
                {member.isBanned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
