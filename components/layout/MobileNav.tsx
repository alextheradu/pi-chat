'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, CheckSquare, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        icon: Home,          label: 'Home' },
  { href: '/dm',      icon: MessageSquare, label: 'Messages' },
  { href: '/tasks',   icon: CheckSquare,   label: 'Tasks' },
  { href: '/profile', icon: User,          label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      className="mobile-nav"
      style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 48,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
        zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, textDecoration: 'none', minHeight: 44,
                color: isActive ? 'var(--yellow)' : 'var(--text-muted)',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
