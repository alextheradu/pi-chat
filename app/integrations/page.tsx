import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { projectConfig } from '@/lib/project-config'

import { WebhookManager } from './webhook-manager'

export const metadata = {
  title: `Integrations | ${projectConfig.appName}`,
  description: `Manage incoming webhooks and external application hooks for ${projectConfig.appName}.`,
}

export default async function IntegrationsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (!hasPermission(session.user.role, 'integration:webhook:manage')) {
    redirect('/')
  }

  const [channels, webhooks] = await Promise.all([
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
  ])

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gap: '1rem',
        }}
      >
        <section
          style={{
            background:
              'linear-gradient(180deg, rgba(245, 197, 24, 0.08), rgba(17, 17, 21, 0.96))',
            border: '1px solid var(--yellow-border)',
            borderRadius: '24px',
            padding: '1.75rem',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--yellow)',
              marginBottom: '0.65rem',
            }}
          >
            Integrations
          </p>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              lineHeight: 1.02,
              marginBottom: '0.9rem',
            }}
          >
            Incoming webhooks for applications and bots.
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: '60rem' }}>
            This is the first integrations slice. Create a webhook, copy the one-time secret URL,
            and let an external application post messages into a {projectConfig.appName} channel as
            a dedicated bot identity.
          </p>
        </section>

        <WebhookManager initialChannels={channels} initialWebhooks={webhooks} />
      </div>
    </main>
  )
}
