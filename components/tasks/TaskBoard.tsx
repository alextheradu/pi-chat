'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { TaskStatus, TaskPriority } from '@prisma/client'
import { TaskCard } from './TaskCard'

interface TaskItem {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  assignee: { id: string; name: string; displayName: string | null; avatarUrl: string | null } | null
  subdivision: { id: string; name: string; displayName: string; color: string } | null
}

interface TaskBoardProps {
  initialTasks: TaskItem[]
}

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO',        label: 'To Do' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'BLOCKED',     label: 'Blocked' },
  { status: 'DONE',        label: 'Done' },
]

function DroppableColumn({ status, label, tasks }: { status: TaskStatus; label: string; tasks: TaskItem[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: 10, padding: '1px 7px' }}>{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          minHeight: 120,
          borderRadius: 6,
          padding: 4,
          background: isOver ? 'var(--bg-hover)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              id={task.id}
              title={task.title}
              description={task.description}
              priority={task.priority}
              dueDate={task.dueDate}
              assignee={task.assignee}
              subdivisionColor={task.subdivision?.color}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export function TaskBoard({ initialTasks }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeTask = activeId ? tasks.find(t => t.id === activeId) ?? null : null

  const onDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const onDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeTaskId = String(active.id)
    const overId = String(over.id)

    // Determine target status: over.id may be a column status or another task id
    const columnStatuses = COLUMNS.map(c => c.status as string)
    let targetStatus: TaskStatus | null = null

    if (columnStatuses.includes(overId)) {
      targetStatus = overId as TaskStatus
    } else {
      // over is a task — find its column
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }

    if (!targetStatus) return

    const activeTask = tasks.find(t => t.id === activeTaskId)
    if (!activeTask || activeTask.status === targetStatus) return

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, status: targetStatus! } : t))

    // Persist
    fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeTaskId, status: targetStatus }),
    }).catch(() => {
      // Revert on error
      setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, status: activeTask.status } : t))
    })
  }, [tasks])

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div style={{ display: 'flex', gap: 16, height: '100%', padding: '0 4px' }}>
        {COLUMNS.map(col => (
          <DroppableColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tasks={tasks.filter(t => t.status === col.status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <TaskCard
            id={activeTask.id}
            title={activeTask.title}
            description={activeTask.description}
            priority={activeTask.priority}
            dueDate={activeTask.dueDate}
            assignee={activeTask.assignee}
            subdivisionColor={activeTask.subdivision?.color}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
