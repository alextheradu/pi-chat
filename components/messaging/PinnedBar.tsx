'use client'

import { useState, useEffect } from 'react'
import { Pin } from 'lucide-react'
import { sanitizeMessageHtml } from '@/lib/sanitize'

interface PinnedBarProps { channelId: string }

export function PinnedBar({ channelId }: PinnedBarProps) {
  const [latestPin, setLatestPin] = useState<{ message: { content: string } } | null>(null)

  useEffect(() => {
    fetch(`/api/pins?channelId=${channelId}`)
      .then(r => r.json() as Promise<{ pins: { message: { content: string } }[] }>)
      .then(data => setLatestPin(data.pins[0] ?? null))
      .catch(console.error)
  }, [channelId])

  if (!latestPin) return null

  const previewText = sanitizeMessageHtml(latestPin.message.content)
    .replace(/<[^>]+>/g, '')
    .slice(0, 80)

  return (
    <div style={{
      background: 'var(--yellow-glow)', borderBottom: '1px solid var(--yellow-border)',
      padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 6,
      cursor: 'pointer', flexShrink: 0,
    }}>
      <Pin size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {previewText}
      </span>
    </div>
  )
}
