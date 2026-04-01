'use client'

import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

export function PushSubscribeButton() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) })
      setSubscribed(true)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <button onClick={subscribe} disabled={subscribed || loading} aria-label={subscribed ? 'Push notifications enabled' : 'Enable push notifications'} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: subscribed ? 'var(--bg-elevated)' : 'var(--yellow)', color: subscribed ? 'var(--text-muted)' : 'var(--text-inverse)', border: 'none', borderRadius: 6, cursor: subscribed ? 'default' : 'pointer', fontSize: 13 }}>
      {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
      {subscribed ? 'Notifications on' : loading ? 'Enabling...' : 'Enable notifications'}
    </button>
  )
}
