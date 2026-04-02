import { randomBytes } from 'node:crypto'

import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import {
  buildWebhookUrl,
  createIncomingWebhookToken,
} from '@/lib/incoming-webhooks'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorized()
  }

  if (!hasPermission(session.user.role, 'integration:webhook:manage')) {
    return forbidden()
  }

  const [webhooks, channels] = await Promise.all([
    prisma.incomingWebhook.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        tokenPreview: true,
        isRevoked: true,
        lastUsedAt: true,
        createdAt: true,
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        botUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    }),
    prisma.channel.findMany({
      where: { isArchived: false },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isPrivate: true,
        isAnnouncement: true,
      },
    }),
  ])

  return NextResponse.json({ webhooks, channels })
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return unauthorized()
  }

  if (!hasPermission(session.user.role, 'integration:webhook:manage')) {
    return forbidden()
  }

  const body = (await request.json()) as {
    name?: string
    description?: string
    channelSlug?: string
  }

  const name = body.name?.trim()
  const description = body.description?.trim() || null
  const channelSlug = body.channelSlug?.trim()

  if (!name || !channelSlug) {
    return NextResponse.json(
      { error: 'Both name and channelSlug are required.' },
      { status: 400 }
    )
  }

  if (name.length > 80 || (description && description.length > 280)) {
    return NextResponse.json(
      { error: 'Name or description is too long.' },
      { status: 400 }
    )
  }

  const channel = await prisma.channel.findUnique({
    where: { slug: channelSlug },
    select: { id: true, slug: true, name: true },
  })

  if (!channel) {
    return NextResponse.json({ error: 'Channel not found.' }, { status: 404 })
  }

  const tokenData = createIncomingWebhookToken()
  const botEmail = `bot.${randomBytes(8).toString('hex')}@bots.pi-chat.local`
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000'

  const result = await prisma.$transaction(async (tx) => {
    const botUser = await tx.user.create({
      data: {
        email: botEmail,
        name,
        displayName: name,
        role: 'GUEST',
        isApproved: true,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
      },
    })

    await tx.channelMember.upsert({
      where: {
        userId_channelId: {
          userId: botUser.id,
          channelId: channel.id,
        },
      },
      update: {},
      create: {
        userId: botUser.id,
        channelId: channel.id,
      },
    })

    const webhook = await tx.incomingWebhook.create({
      data: {
        name,
        description,
        channelId: channel.id,
        createdById: session.user.id,
        botUserId: botUser.id,
        tokenHash: tokenData.tokenHash,
        tokenPreview: tokenData.tokenPreview,
      },
      select: {
        id: true,
        name: true,
        description: true,
        tokenPreview: true,
        isRevoked: true,
        createdAt: true,
        channel: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        botUser: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    })

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'WEBHOOK_CREATED',
        targetType: 'IncomingWebhook',
        targetId: webhook.id,
        metadata: {
          channelSlug: channel.slug,
          name,
        },
      },
    })

    return {
      webhook,
      secretToken: tokenData.token,
      webhookUrl: buildWebhookUrl(appUrl, tokenData.token),
    }
  })

  return NextResponse.json(result, { status: 201 })
}
