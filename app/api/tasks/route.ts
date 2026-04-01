import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { TaskStatus, TaskPriority } from '@prisma/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      createdBy: { select: { id: true, name: true, displayName: true } },
      subdivision: true,
    },
  })
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session.user.role, 'task:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json() as { title: string; description?: string; assigneeId?: string; subdivisionId?: string; priority?: TaskPriority; dueDate?: string; channelId?: string }
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      subdivisionId: body.subdivisionId,
      priority: body.priority ?? 'MEDIUM',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      channelId: body.channelId,
      createdById: session.user.id,
    },
    include: { assignee: { select: { id: true, name: true, displayName: true, avatarUrl: true } }, subdivision: true },
  })
  return NextResponse.json({ task }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await req.json() as { id: string; status: TaskStatus }
  const task = await prisma.task.update({ where: { id }, data: { status } })
  return NextResponse.json({ task })
}
