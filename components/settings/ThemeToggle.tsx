'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'

const options = [
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={async () => {
            setTheme(value)
            await fetch('/api/user/settings', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ theme: value.toUpperCase() }),
            })
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            background: theme === value ? 'var(--yellow)' : 'var(--bg-elevated)',
            color: theme === value ? 'var(--text-inverse)' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}
