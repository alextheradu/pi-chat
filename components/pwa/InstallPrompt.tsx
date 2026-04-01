'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt) return null

  const install = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 200, background: 'var(--bg-elevated)', border: '1px solid var(--yellow-border)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <Download size={16} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Install Pi-Chat</span>
      <button onClick={install} style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Install</button>
      <button onClick={() => setDeferredPrompt(null)} aria-label="Dismiss install prompt" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: 2 }}>×</button>
    </div>
  )
}
