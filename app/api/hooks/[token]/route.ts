import { NextResponse } from 'next/server'

import { hashIncomingWebhookToken } from '@/lib/incoming-webhooks'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteProps = {
  params: Promise<{ token: string }>
}

export async function POST(request: Request, { params }: RouteProps) {
  const { token } = await params
  const tokenHash = hashIncomingWebhookToken(token)

  const body = (await request.json().catch(() => null)) as
    | {
        text?: string
      }
    | null

  const text = body?.text?.trim()

  if (!text) {
    return NextResponse.json({ error: 'text is required.' }, { status: 400 })
  }

  if (text.length > 4000) {
    return NextResponse.json(
      { error: 'text must be 4000 characters or fewer.' },
      { status: 400 }
    )
  }

  const webhook = await prisma.incomingWebhook.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      isRevoked: true,
      channelId: true,
      botUserId: true,
    },
  })

  if (!webhook || webhook.isRevoked) {
    return NextResponse.json({ error: 'Webhook not found.' }, { status: 404 })
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        content: text,
        channelId: webhook.channelId,
        authorId: webhook.botUserId,
      },
      select: {
        id: true,
        channelId: true,
        authorId: true,
        createdAt: true,
      },
    })

    await tx.incomingWebhook.update({
      where: { id: webhook.id },
      data: { lastUsedAt: new Date() },
    })

    return created
  })

  return NextResponse.json({
    ok: true,
    message,
  })
}
