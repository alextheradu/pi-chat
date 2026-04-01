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
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6,
              textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-sans)',
              color: isActive ? 'var(--yellow)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-active)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--yellow)' : '3px solid transparent',
              marginBottom: 2,
            }}>
              <Icon size={16} />{label}
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
