import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@prisma/client'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId, action, role } = await req.json() as { userId: string; action: 'set_role' | 'ban' | 'unban' | 'approve'; role?: Role }

  if (action === 'set_role') {
    if (!hasPermission(session.user.role, 'member:change_role')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { role: role! } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_ROLE_CHANGED', targetType: 'User', targetId: userId, metadata: { role } } })
  } else if (action === 'ban') {
    if (!hasPermission(session.user.role, 'member:ban')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { isBanned: true } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_BANNED', targetType: 'User', targetId: userId } })
  } else if (action === 'unban') {
    if (!hasPermission(session.user.role, 'member:ban')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await prisma.user.update({ where: { id: userId }, data: { isBanned: false } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_UNBANNED', targetType: 'User', targetId: userId } })
  } else if (action === 'approve') {
    await prisma.user.update({ where: { id: userId }, data: { isApproved: true } })
    await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'MEMBER_APPROVED', targetType: 'User', targetId: userId } })
  }
  return NextResponse.json({ ok: true })
}
