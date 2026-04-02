# Pi-Chat Phase 5: Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all 7 admin sections: Overview stats, Members table, Channels table, Roles editor, Invites, Audit Log, and Broadcast composer — accessible only to ADMIN and MODERATOR roles.

**Architecture:** `/admin/*` route group with its own layout and sidebar. All pages are Server Components with data fetched via Prisma directly (no separate API layer for admin — server-side auth check on each layout). Role check happens in `app/admin/layout.tsx`. Client components only where interactivity is required.

**Tech Stack:** Next.js App Router, Prisma, shadcn/ui Table/Badge/Dialog, TanStack Table (client-side), Tiptap (broadcast composer), lucide-react

**Prerequisite:** Phase 3 complete (messaging foundation needed for broadcast).

---

## File Map

| File | Purpose |
|------|---------|
| `app/admin/layout.tsx` | Admin shell with auth check (ADMIN/MODERATOR only) |
| `app/admin/page.tsx` | Overview: stat cards + recent audit + recent signups |
| `app/admin/members/page.tsx` | Members table with TanStack Table |
| `app/admin/channels/page.tsx` | Channels table + CreateChannelModal |
| `app/admin/roles/page.tsx` | Permission matrix editor |
| `app/admin/invites/page.tsx` | Invites table + create invite modal |
| `app/admin/audit/page.tsx` | Audit log with filters |
| `app/admin/broadcast/page.tsx` | Broadcast composer |
| `components/admin/AdminSidebar.tsx` | Admin navigation sidebar |
| `components/admin/MembersTable.tsx` | TanStack Table for members |
| `components/admin/ChannelsTable.tsx` | Channels management table |
| `components/admin/RolesEditor.tsx` | Permission matrix grid |
| `components/admin/AuditLogTable.tsx` | Audit log table with filters |
| `components/admin/InvitesTable.tsx` | Invites table |
| `components/admin/BroadcastComposer.tsx` | Broadcast message composer |
| `app/api/admin/route.ts` | Admin API: stats, member management, channel ops |
| `app/api/admin/members/route.ts` | PATCH member role/ban, DELETE member |
| `lib/email.ts` | Nodemailer helper for sending invite emails |
| `app/api/admin/invites/route.ts` | POST create invite (+ send email), DELETE revoke |

---

## Task 1: Admin Layout & Sidebar

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Create `components/admin/AdminSidebar.tsx`**

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Hash, Shield, Mail, ScrollText, Megaphone, ArrowLeft } from 'lucide-react'

const NAV = [
  { href: '/admin',           icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/members',   icon: Users,           label: 'Members' },
  { href: '/admin/channels',  icon: Hash,            label: 'Channels' },
  { href: '/admin/roles',     icon: Shield,          label: 'Roles' },
  { href: '/admin/invites',   icon: Mail,            label: 'Invites' },
  { href: '/admin/audit',     icon: ScrollText,      label: 'Audit Log' },
  { href: '/admin/broadcast', icon: Megaphone,       label: 'Broadcast' },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav style={{ width: 220, flexShrink: 0, background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '16px 12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--yellow)' }}>Admin Panel</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Pi-Chat · Team 1676</div>
      </div>
      <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-sans)',
                color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-active)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--yellow)' : '3px solid transparent',
                marginBottom: 2,
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </div>
      <div style={{ padding: '8px', borderTop: '1px solid var(--border-subtle)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, textDecoration: 'none', fontSize: 13, color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to Pi-Chat
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Create `app/admin/layout.tsx`**

```typescript
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') redirect('/')

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/layout.tsx components/admin/AdminSidebar.tsx
git commit -m "feat: add admin layout with auth guard and admin sidebar"
```

---

## Task 2: Admin Overview Page

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create `app/admin/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { startOfDay } from 'date-fns'

export default async function AdminOverviewPage() {
  const session = await auth()
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
    { label: 'Total Members',    value: totalMembers },
    { label: 'Active Today',     value: activeToday },
    { label: 'Total Channels',   value: totalChannels },
    { label: 'Messages Today',   value: messagesToday },
    { label: 'Pending Approvals', value: pendingApprovals, highlight: pendingApprovals > 0 },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Overview</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 28, fontFamily: 'var(--font-mono)', fontWeight: 700, color: stat.highlight ? 'var(--yellow)' : 'var(--text-primary)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Recent Audit Log</h2>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {recentAudit.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)', flexShrink: 0 }}>
              {log.action}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {log.actor.displayName ?? log.actor.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
              {new Date(log.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin overview with stat cards and recent audit log"
```

---

## Task 3: Members Management

**Files:**
- Create: `app/api/admin/members/route.ts`
- Create: `components/admin/MembersTable.tsx`
- Create: `app/admin/members/page.tsx`

- [ ] **Step 1: Create `app/api/admin/members/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { Role } from '@prisma/client'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, action, role } = await req.json() as { userId: string; action: 'set_role' | 'ban' | 'unban' | 'approve'; role?: Role }

  if (action === 'set_role') {
    if (!hasPermission(session.user.role, 'member:change_role')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { role: role! } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_ROLE_CHANGED', targetType: 'User', targetId: userId, metadata: { role } } })
  } else if (action === 'ban') {
    if (!hasPermission(session.user.role, 'member:ban')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { isBanned: true } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_BANNED', targetType: 'User', targetId: userId } })
  } else if (action === 'unban') {
    if (!hasPermission(session.user.role, 'member:ban')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { isBanned: false } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_UNBANNED', targetType: 'User', targetId: userId } })
  } else if (action === 'approve') {
    await prisma.user.update({ where: { id: userId }, data: { isApproved: true } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_APPROVED', targetType: 'User', targetId: userId } })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/admin/members/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { MembersTable } from '@/components/admin/MembersTable'

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subdivisionMembers: { include: { subdivision: true } } },
  })

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Members</h1>
      <MembersTable members={members} />
    </div>
  )
}
```

- [ ] **Step 3: Create `components/admin/MembersTable.tsx`** (client component with TanStack Table)

> **Contribution request:** The members table is the primary admin control surface. I've set up the data fetching and component scaffold. Please implement the table using TanStack Table (v8) with these column definitions: Avatar+Name, Email, Role (badge with yellow=ADMIN, gray=others), Subdivision, Status (PresenceDot), Joined date, Last Seen, and a row Actions dropdown (Change Role, Ban/Unban, Approve). Also add the filter toolbar with role dropdown and search input. See the spec section "/admin/members" for the full column and action spec.

```typescript
'use client'

import { useState } from 'react'
import type { User, Subdivision } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { PresenceDot } from '@/components/shared/PresenceDot'
import { formatDistanceToNow } from 'date-fns'

type MemberWithSubs = User & { subdivisionMembers: { subdivision: Subdivision; isLead: boolean }[] }

interface MembersTableProps { members: MemberWithSubs[] }

const ROLE_BADGE_STYLE = {
  ADMIN:            { background: 'var(--yellow)', color: 'var(--text-inverse)' },
  MODERATOR:        { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)' },
  SUBDIVISION_LEAD: { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' },
  MEMBER:           { background: 'transparent', color: 'var(--text-muted)' },
  GUEST:            { background: 'transparent', color: 'var(--text-muted)', border: '1px dashed var(--border-default)' },
}

export function MembersTable({ members }: MembersTableProps) {
  const [search, setSearch] = useState('')
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  // TODO: Replace with TanStack Table implementation
  // Columns: Avatar+Name | Email | Role (badge) | Subdivision | Status | Joined | Last Seen | Actions
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '6px 10px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: 280 }}
        />
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {['Member', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserAvatar userId={member.id} name={member.displayName ?? member.name} avatarUrl={member.avatarUrl} size={28} />
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{member.displayName ?? member.name}</div>
                      {member.isBanned && <span style={{ fontSize: 10, color: 'var(--error)' }}>BANNED</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{member.email}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, ...(ROLE_BADGE_STYLE[member.role] ?? {}) }}>
                    {member.role}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PresenceDot status={member.status} size={7} borderColor="var(--bg-surface)" />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{member.status.toLowerCase()}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {/* Actions dropdown: Change Role, Ban/Unban, Approve */}
                  <button style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                    Actions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/members/ app/api/admin/members/ components/admin/MembersTable.tsx
git commit -m "feat: add admin members page with table, search, and role/ban actions API"
```

---

## Task 4: Remaining Admin Pages

**Files:**
- Create: `app/admin/channels/page.tsx`
- Create: `app/admin/invites/page.tsx`
- Create: `app/admin/audit/page.tsx`
- Create: `app/admin/roles/page.tsx`
- Create: `app/admin/broadcast/page.tsx`
- Create: `components/admin/BroadcastComposer.tsx`
- Create: `app/api/admin/invites/route.ts`

- [ ] **Step 1: Create `lib/email.ts`** (Nodemailer invite email helper)

```typescript
import nodemailer from 'nodemailer'

// Configure transport from environment. Works with any SMTP provider.
// Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
// For development, use a service like Mailtrap or Ethereal.
function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST ?? 'smtp.ethereal.email',
    port:   parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface SendInviteEmailOptions {
  to: string
  inviteToken: string
  invitedByName: string
  role: string
  appUrl: string
}

export async function sendInviteEmail({ to, inviteToken, invitedByName, role, appUrl }: SendInviteEmailOptions) {
  const transport = createTransport()
  const signInUrl = `${appUrl}/login?invite=${inviteToken}`

  await transport.sendMail({
    from: `"Pi-Chat · Team 1676" <${process.env.SMTP_USER ?? 'noreply@example.com'}>`,
    to,
    subject: `${invitedByName} invited you to Pi-Chat — Team 1676`,
    text: [
      `You've been invited to join Pi-Chat, Team 1676's communication hub, as a ${role}.`,
      '',
      `Click the link below to sign in:`,
      signInUrl,
      '',
      `This link expires based on the invite settings.`,
    ].join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 480px;">
        <h2 style="color: #f5c518;">You're invited to Pi-Chat 🤖</h2>
        <p><strong>${invitedByName}</strong> has invited you to join <strong>Team 1676 Pi-Chat</strong> as a <strong>${role}</strong>.</p>
        <p>
          <a href="${signInUrl}" style="display:inline-block;background:#f5c518;color:#0c0c0e;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:700;">
            Sign In to Pi-Chat
          </a>
        </p>
        <p style="color:#666;font-size:12px;">Or copy this link: ${signInUrl}</p>
      </div>
    `,
  })
}
```

Add to `.env.example`:
```env
# ── Email (SMTP) ───────────────────────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

- [ ] **Step 2: Create `app/api/admin/invites/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { sendInviteEmail } from '@/lib/email'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user.role, 'member:invite_guest')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role, expiryDays, sendEmail } = await req.json() as {
    email: string
    role: 'MEMBER' | 'GUEST'
    expiryDays: number | null
    sendEmail: boolean
  }

  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      invitedById: session.user.id,
      expiresAt: expiryDays ? addDays(new Date(), expiryDays) : new Date('2099-01-01'),
    },
    include: { invitedBy: { select: { name: true, displayName: true } } },
  })

  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: 'INVITE_CREATED', targetType: 'Invite', targetId: invite.id, metadata: { email, role } },
  })

  // Send invite email if requested and SMTP is configured
  if (sendEmail && process.env.SMTP_HOST) {
    try {
      await sendInviteEmail({
        to: email,
        inviteToken: invite.token,
        invitedByName: invite.invitedBy.displayName ?? invite.invitedBy.name,
        role,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://chat.example.com',
      })
    } catch (err) {
      console.error('Failed to send invite email:', err)
      // Don't fail the request if email fails — invite is still created
    }
  }

  return NextResponse.json({ invite, emailSent: sendEmail && !!process.env.SMTP_HOST }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user.role, 'member:invite_guest')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { inviteId } = await req.json() as { inviteId: string }
  await prisma.invite.delete({ where: { id: inviteId } })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create all remaining admin pages**

`app/admin/channels/page.tsx`:
```typescript
import { prisma } from '@/lib/prisma'

export default async function AdminChannelsPage() {
  const channels = await prisma.channel.findMany({
    orderBy: { createdAt: 'desc' },
    include: { subdivision: true, _count: { select: { members: true, messages: true } } },
  })
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Channels</h1>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {['Name', 'Type', 'Subdivision', 'Members', 'Messages', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {channels.map(ch => (
              <tr key={ch.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>#{ch.name}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{ch.isAnnouncement ? 'Announcement' : ch.isPrivate ? 'Private' : 'Public'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{ch.subdivision?.displayName ?? '—'}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{ch._count.members}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{ch._count.messages}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: ch.isArchived ? 'var(--text-muted)' : 'var(--success)', background: ch.isArchived ? 'var(--bg-hover)' : 'rgba(34,197,94,0.12)', padding: '2px 6px', borderRadius: 4 }}>
                    {ch.isArchived ? 'ARCHIVED' : 'ACTIVE'}
                  </span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <button style={{ fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

`app/admin/invites/page.tsx`:
```typescript
import { prisma } from '@/lib/prisma'

export default async function AdminInvitesPage() {
  const invites = await prisma.invite.findMany({
    orderBy: { createdAt: 'desc' },
    include: { invitedBy: { select: { name: true, displayName: true } } },
  })
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Invites</h1>
      <div style={{ marginBottom: 12 }}>
        <button style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Invite Someone
        </button>
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {invites.map(invite => (
          <div key={invite.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{invite.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Invited by {invite.invitedBy.displayName ?? invite.invitedBy.name} · Expires {new Date(invite.expiresAt).toLocaleDateString()}</div>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 4, background: invite.usedAt ? 'var(--bg-elevated)' : 'rgba(34,197,94,0.12)', color: invite.usedAt ? 'var(--text-muted)' : 'var(--success)' }}>
              {invite.usedAt ? 'USED' : 'PENDING'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

`app/admin/audit/page.tsx`:
```typescript
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    take: 100, orderBy: { createdAt: 'desc' },
    include: { actor: { select: { name: true, displayName: true, avatarUrl: true, id: true } } },
  })
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Audit Log</h1>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, overflow: 'hidden' }}>
        {logs.map(log => (
          <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)', flexShrink: 0 }}>
              {log.action}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {log.actor.displayName ?? log.actor.name}
            </span>
            {log.targetId && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.targetType}: {log.targetId.slice(0, 8)}</span>}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

`app/admin/roles/page.tsx`:
```typescript
export default function AdminRolesPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Roles & Permissions</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Role/permission matrix editor — wire up RolesEditor client component here.</p>
    </div>
  )
}
```

`app/admin/broadcast/page.tsx`:
```typescript
import { BroadcastComposer } from '@/components/admin/BroadcastComposer'

export default function AdminBroadcastPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Broadcast</h1>
      <BroadcastComposer />
    </div>
  )
}
```

- [ ] **Step 3: Create `components/admin/BroadcastComposer.tsx`** (minimal, can be wired to actual posting in Phase 6)

```typescript
'use client'

import { Send } from 'lucide-react'

export function BroadcastComposer() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Target</div>
        <select style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 12, width: '100%' }}>
          <option value="all">All Members</option>
        </select>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Message</div>
        <textarea
          placeholder="Write your announcement..."
          rows={6}
          style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-sans)' }}
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <Send size={14} /> Send Broadcast
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/ components/admin/ app/api/admin/
git commit -m "feat: add all admin pages — channels, invites, audit, roles, broadcast"
```

---

## Phase 5 Completion Checklist

- [ ] Non-admin user accessing `/admin/*` is redirected to `/`
- [ ] Admin sidebar nav highlights correct section
- [ ] Overview stat cards show real data from DB
- [ ] Members table lists all users with roles and status
- [ ] Ban action calls API and updates DB
- [ ] Channels table shows all channels with member/message counts
- [ ] Invites page shows pending invites
- [ ] Creating an invite with `sendEmail: true` sends an email via Nodemailer (verify with SMTP_HOST set)
- [ ] Audit log shows last 100 entries in reverse order
- [ ] Broadcast composer renders with target selector and send button
- [ ] `npm run build` passes with zero TypeScript errors
