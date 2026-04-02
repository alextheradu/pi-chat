import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/messages/[id]'>) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message || message.authorId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { content } = await req.json() as { content: string }
  const updated = await prisma.message.update({ where: { id }, data: { content, isEdited: true } })
  return NextResponse.json({ message: updated })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/messages/[id]'>) {
  const { id } = await ctx.params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const canDelete = message.authorId === session.user.id || ['ADMIN', 'MODERATOR'].includes(session.user.role)
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.message.update({ where: { id }, data: { isDeleted: true } })
  return NextResponse.json({ ok: true })
}
