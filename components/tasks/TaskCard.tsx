'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, AlertTriangle, ArrowUp, Minus, ArrowDown, UserPlus } from 'lucide-react'
import { isAfter } from 'date-fns'
import type { TaskPriority } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'

interface TaskCardProps {
  id: string
  title: string
  description?: string | null
  priority: TaskPriority
  dueDate?: string | null
  assignee?: { id: string; name: string; displayName: string | null; avatarUrl: string | null } | null
  subdivisionColor?: string
}

const PRIORITY_ICON: Record<TaskPriority, React.ElementType> = {
  URGENT: AlertTriangle, HIGH: ArrowUp, MEDIUM: Minus, LOW: ArrowDown,
}
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  URGENT: 'var(--error, #ef4444)', HIGH: 'var(--warning, #f97316)', MEDIUM: 'var(--text-muted)', LOW: 'var(--text-muted)',
}

export function TaskCard({ id, title, description, priority, dueDate, assignee, subdivisionColor }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const isOverdue = dueDate ? isAfter(new Date(), new Date(dueDate)) : false
  const PriorityIcon = PRIORITY_ICON[priority]

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 12px', cursor: 'grab', userSelect: 'none', marginBottom: 6 }} {...attributes} {...listeners}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {subdivisionColor && <span style={{ width: 3, height: 40, background: subdivisionColor, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: description ? 4 : 0, fontWeight: 500 }}>{title}</div>
          {description && <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{description}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <PriorityIcon size={12} style={{ color: PRIORITY_COLOR[priority], flexShrink: 0 }} />
            {dueDate && (
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isOverdue ? 'var(--error, #ef4444)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Calendar size={10} />{new Date(dueDate).toLocaleDateString()}
              </span>
            )}
            <div style={{ marginLeft: 'auto' }}>
              {assignee ? <UserAvatar userId={assignee.id} name={assignee.displayName ?? assignee.name} avatarUrl={assignee.avatarUrl} size={20} /> : <UserPlus size={16} style={{ color: 'var(--text-muted)' }} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
