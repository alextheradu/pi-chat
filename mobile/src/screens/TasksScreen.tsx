import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { CheckSquare, Circle, AlertCircle, CheckCircle2 } from 'lucide-react'

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'

type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assignee?: { name: string; displayName?: string; avatarUrl?: string }
  dueAt?: string
}

const STATUS_FILTERS: { value: TaskStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'TODO',        label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED',     label: 'Blocked' },
  { value: 'DONE',        label: 'Done' },
]

const STATUS_META: Record<TaskStatus, { color: string; Icon: typeof Circle }> = {
  TODO:        { color: 'var(--text-muted)',   Icon: Circle },
  IN_PROGRESS: { color: 'var(--yellow)',       Icon: CheckSquare },
  BLOCKED:     { color: 'var(--danger)',       Icon: AlertCircle },
  DONE:        { color: '#4ade80',             Icon: CheckCircle2 },
}

export default function TasksScreen() {
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL')

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get<Task[]>('/api/tasks').then((r) => r.data),
  })

  const visible = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Tasks</h1>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: filter === value ? 600 : 400,
                background: filter === value ? 'var(--yellow)' : 'var(--bg-elevated)',
                color: filter === value ? '#000' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && (
          <p style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
        )}

        {!isLoading && visible.length === 0 && (
          <p style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>
            No tasks here.
          </p>
        )}

        {visible.map((task) => {
          const meta = STATUS_META[task.status]
          const Icon = meta.Icon
          const due = task.dueAt ? new Date(task.dueAt) : null
          const isOverdue = due && due < new Date() && task.status !== 'DONE'

          return (
            <div
              key={task.id}
              style={{
                display: 'flex', gap: 12, padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                alignItems: 'flex-start',
              }}
            >
              <Icon size={18} color={meta.color} style={{ marginTop: 2, flexShrink: 0 }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 15, fontWeight: 500,
                    color: task.status === 'DONE' ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </p>

                {task.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    {task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                  {task.assignee && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {task.assignee.displayName ?? task.assignee.name}
                    </span>
                  )}
                  {due && (
                    <span
                      style={{
                        fontSize: 12,
                        color: isOverdue ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: isOverdue ? 600 : 400,
                      }}
                    >
                      {isOverdue ? 'Overdue · ' : ''}
                      {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
