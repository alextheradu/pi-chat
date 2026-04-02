'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, CheckSquare, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        Icon: Home,          label: 'Home' },
  { href: '/dm',      Icon: MessageSquare, label: 'Messages' },
  { href: '/tasks',   Icon: CheckSquare,   label: 'Tasks' },
  { href: '/profile', Icon: User,          label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 52,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="mobile-nav"
    >
      <div style={{ display: 'flex', height: '100%' }}>
        {NAV_ITEMS.map(({ href, Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                textDecoration: 'none',
                color: isActive ? 'var(--yellow)' : 'var(--text-muted)',
                minHeight: 44,
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
