import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import { sendInviteEmail } from '@/lib/email'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user.role, 'member:invite_guest')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { email, role, expiryDays, sendEmail } = await req.json() as { email: string; role: 'MEMBER' | 'GUEST'; expiryDays: number | null; sendEmail: boolean }
  const invite = await prisma.invite.create({
    data: { email, role, invitedById: session.user.id, expiresAt: expiryDays ? addDays(new Date(), expiryDays) : new Date('2099-01-01') },
    include: { invitedBy: { select: { name: true, displayName: true } } },
  })
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: 'INVITE_CREATED', targetType: 'Invite', targetId: invite.id, metadata: { email, role } } })
  if (sendEmail && process.env.SMTP_HOST) {
    try {
      await sendInviteEmail({ to: email, inviteToken: invite.token, invitedByName: invite.invitedBy.displayName ?? invite.invitedBy.name, role, appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://chat.team1676.org' })
    } catch (err) { console.error('Failed to send invite email:', err) }
  }
  return NextResponse.json({ invite, emailSent: sendEmail && !!process.env.SMTP_HOST }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || !hasPermission(session.user.role, 'member:invite_guest')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const inviteId = req.nextUrl.searchParams.get('inviteId')
  if (!inviteId) return NextResponse.json({ error: 'inviteId required' }, { status: 400 })
  await prisma.invite.delete({ where: { id: inviteId } })
  return NextResponse.json({ ok: true })
}
