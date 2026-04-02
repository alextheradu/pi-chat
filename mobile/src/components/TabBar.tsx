import { Hash, MessageCircle, CheckSquare, Settings } from 'lucide-react'

export type Tab = 'channels' | 'dms' | 'tasks' | 'settings'

type Props = { active: Tab; onChange: (t: Tab) => void }

const tabs: { id: Tab; label: string; Icon: typeof Hash }[] = [
  { id: 'channels', label: 'Channels', Icon: Hash },
  { id: 'dms',      label: 'Messages', Icon: MessageCircle },
  { id: 'tasks',    label: 'Tasks',    Icon: CheckSquare },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export default function TabBar({ active, onChange }: Props) {
  return (
    <nav
      style={{
        display: 'flex',
        height: 'var(--tab-height)',
        paddingBottom: 'var(--safe-bottom)',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              color: isActive ? 'var(--yellow)' : 'var(--text-muted)',
              fontSize: 10, fontWeight: isActive ? 600 : 400,
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
