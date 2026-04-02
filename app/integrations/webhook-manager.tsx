'use client'

import { useState, useTransition } from 'react'

type Channel = {
  id: string
  name: string
  slug: string
  isPrivate: boolean
  isAnnouncement: boolean
}

type Webhook = {
  id: string
  name: string
  description: string | null
  tokenPreview: string
  isRevoked: boolean
  lastUsedAt: string | Date | null
  createdAt: string | Date
  channel: {
    id: string
    name: string
    slug: string
  }
  botUser: {
    id: string
    displayName: string | null
    email: string
  }
}

type CreatedWebhook = {
  webhookUrl: string
  secretToken: string
}

export function WebhookManager({
  initialChannels,
  initialWebhooks,
}: {
  initialChannels: Channel[]
  initialWebhooks: Webhook[]
}) {
  const [channels] = useState(initialChannels)
  const [webhooks, setWebhooks] = useState(initialWebhooks)
  const [createdWebhook, setCreatedWebhook] = useState<CreatedWebhook | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(formData: FormData) {
    const payload = {
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      channelSlug: String(formData.get('channelSlug') ?? ''),
    }

    setError(null)
    setCreatedWebhook(null)

    const response = await fetch('/api/integrations/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as
      | {
          error: string
        }
      | {
          webhook: Webhook
          webhookUrl: string
          secretToken: string
        }

    if (!response.ok || 'error' in data) {
      setError('error' in data ? data.error : 'Failed to create webhook.')
      return
    }

    setWebhooks((current) => [data.webhook, ...current])
    setCreatedWebhook({
      webhookUrl: data.webhookUrl,
      secretToken: data.secretToken,
    })
  }

  async function handleRevoke(id: string) {
    setError(null)

    const response = await fetch(`/api/integrations/webhooks/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? 'Failed to revoke webhook.')
      return
    }

    setWebhooks((current) =>
      current.map((webhook) =>
        webhook.id === id ? { ...webhook, isRevoked: true } : webhook
      )
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '1rem',
        gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)',
      }}
    >
      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '1.25rem',
          alignSelf: 'start',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Create webhook</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          The generated URL is shown once. Store it in the external application immediately.
        </p>

        <form
          action={(formData) => {
            startTransition(() => {
              void handleCreate(formData)
            })
          }}
          style={{ display: 'grid', gap: '0.85rem' }}
        >
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Name</span>
            <input
              name="name"
              required
              placeholder="Build Alerts"
              style={{
                minHeight: '44px',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '0.75rem',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Channel</span>
            <select
              name="channelSlug"
              required
              defaultValue=""
              style={{
                minHeight: '44px',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '0.75rem',
              }}
            >
              <option value="" disabled>
                Select a channel
              </option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.slug}>
                  #{channel.slug}
                  {channel.isAnnouncement ? ' · announcement' : ''}
                  {channel.isPrivate ? ' · private' : ''}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Description</span>
            <textarea
              name="description"
              rows={3}
              placeholder="Posts deployment updates into #announcements."
              style={{
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                padding: '0.75rem',
                resize: 'vertical',
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            style={{
              minHeight: '46px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--yellow)',
              color: 'var(--text-inverse)',
              fontWeight: 700,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.75 : 1,
            }}
          >
            {isPending ? 'Creating...' : 'Create webhook'}
          </button>
        </form>

        {error ? (
          <p style={{ color: 'var(--error)', marginTop: '0.85rem', lineHeight: 1.6 }}>{error}</p>
        ) : null}

        {createdWebhook ? (
          <div
            style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '14px',
              background: 'rgba(245, 197, 24, 0.08)',
              border: '1px solid var(--yellow-border)',
            }}
          >
            <div style={{ marginBottom: '0.55rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Save this secret now
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.6rem' }}>
              This URL is shown once. If you lose it, revoke the webhook and create a new one.
            </p>
            <code
              style={{
                display: 'block',
                overflowWrap: 'anywhere',
                background: '#09090b',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: 'var(--text-primary)',
              }}
            >
              {createdWebhook.webhookUrl}
            </code>
          </div>
        ) : null}
      </section>

      <section
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          padding: '1.25rem',
        }}
      >
        <h2 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Existing webhooks</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1rem' }}>
          Revoke a webhook if an application should stop posting. Existing bot messages remain in
          the channel history.
        </p>

        <div style={{ display: 'grid', gap: '0.85rem' }}>
          {webhooks.length === 0 ? (
            <div
              style={{
                borderRadius: '14px',
                border: '1px solid var(--border-subtle)',
                padding: '1rem',
                color: 'var(--text-secondary)',
              }}
            >
              No webhooks created yet.
            </div>
          ) : (
            webhooks.map((webhook) => (
              <article
                key={webhook.id}
                style={{
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  padding: '1rem',
                  background: 'var(--bg-base)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'start',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.3rem' }}>
                      {webhook.name}
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      #{webhook.channel.slug} · {webhook.botUser.displayName ?? webhook.botUser.email}
                    </div>
                  </div>
                  <span
                    style={{
                      color: webhook.isRevoked ? 'var(--error)' : 'var(--yellow)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {webhook.isRevoked ? 'revoked' : 'active'}
                  </span>
                </div>

                {webhook.description ? (
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                    {webhook.description}
                  </p>
                ) : null}

                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                  Token preview: <code>{webhook.tokenPreview}</code>
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                  Created: {new Date(webhook.createdAt).toLocaleString()}
                </div>
                <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.92rem' }}>
                  Last used:{' '}
                  {webhook.lastUsedAt
                    ? new Date(webhook.lastUsedAt).toLocaleString()
                    : 'Never'}
                </div>

                {!webhook.isRevoked ? (
                  <button
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        void handleRevoke(webhook.id)
                      })
                    }}
                    disabled={isPending}
                    style={{
                      marginTop: '0.85rem',
                      minHeight: '40px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(239, 68, 68, 0.32)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: 'var(--error)',
                      cursor: isPending ? 'wait' : 'pointer',
                    }}
                  >
                    Revoke webhook
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
