import { useMemo } from 'react'

const AVATAR_COLORS = [
  '#6366f1', '#f59e0b', '#22c55e', '#ef4444',
  '#8b5cf6', '#3b82f6', '#f97316', '#ec4899',
]

function getColorFromId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? '#6366f1'
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')
}

interface UserAvatarProps {
  userId: string
  name: string
  avatarUrl?: string | null
  size?: number
  className?: string
}

export function UserAvatar({ userId, name, avatarUrl, size = 32, className }: UserAvatarProps) {
  const color = useMemo(() => getColorFromId(userId), [userId])
  const initials = useMemo(() => getInitials(name), [name])

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  return (
    <div
      aria-label={name}
      className={className}
      style={{
        width: size, height: size, borderRadius: '50%', backgroundColor: color,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.375, fontWeight: 500, fontFamily: 'var(--font-mono)',
        flexShrink: 0, userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}
