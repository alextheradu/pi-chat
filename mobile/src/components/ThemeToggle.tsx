import { Moon, Sun, Monitor } from 'lucide-react'
import { useThemeStore } from '../store/theme'

type Mode = 'dark' | 'light' | 'system'

const options: { value: Mode; label: string; Icon: typeof Moon }[] = [
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'system', label: 'System', Icon: Monitor },
]

export default function ThemeToggle() {
  const { mode, setMode } = useThemeStore()
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6, padding: '12px 8px',
            borderRadius: 10,
            background: mode === value ? 'var(--yellow)' : 'var(--bg-elevated)',
            color: mode === value ? '#000' : 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
            fontSize: 11, fontWeight: mode === value ? 600 : 400,
          }}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </div>
  )
}
