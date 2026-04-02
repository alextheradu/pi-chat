import type { UserStatus } from '@prisma/client'

const STATUS_COLORS: Record<UserStatus, string> = {
  ONLINE:  'var(--online)',
  AWAY:    'var(--away)',
  DND:     'var(--dnd)',
  OFFLINE: 'var(--offline)',
}

interface PresenceDotProps {
  status: UserStatus
  size?: number
  borderColor?: string
}

export function PresenceDot({ status, size = 7, borderColor = 'var(--bg-surface)' }: PresenceDotProps) {
  return (
    <span
      aria-label={status.toLowerCase()}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status],
        border: `1.5px solid ${borderColor}`,
        flexShrink: 0,
      }}
    />
  )
}
