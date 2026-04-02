import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteProps = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasPermission(session.user.role, 'integration:webhook:manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const existing = await prisma.incomingWebhook.findUnique({
    where: { id },
    select: { id: true, isRevoked: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 })
  }

  if (!existing.isRevoked) {
    await prisma.$transaction([
      prisma.incomingWebhook.update({
        where: { id },
        data: { isRevoked: true },
      }),
      prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'WEBHOOK_REVOKED',
          targetType: 'IncomingWebhook',
          targetId: id,
        },
      }),
    ])
  }

  return NextResponse.json({ ok: true })
}
