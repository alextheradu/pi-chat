import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { TaskBoard } from '@/components/tasks/TaskBoard'

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const rawTasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      subdivision: { select: { id: true, name: true, displayName: true, color: true } },
    },
  })

  // Serialize dates to ISO strings for client component
  const tasks = rawTasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    assignee: t.assignee,
    subdivision: t.subdivision,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Tasks</h1>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <TaskBoard initialTasks={tasks} />
      </div>
    </div>
  )
}
