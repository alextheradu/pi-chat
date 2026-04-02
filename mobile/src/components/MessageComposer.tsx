import { useState } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Send, Paperclip } from 'lucide-react'
import { api } from '../lib/api'

type Props = { channelId: string; onSent?: () => void }

export default function MessageComposer({ channelId, onSent }: Props) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!text.trim()) return
    setSending(true)
    try {
      await api.post('/api/messages', { channelId, content: text.trim() })
      setText('')
      onSent?.()
    } finally {
      setSending(false)
    }
  }

  async function handleAttach() {
    const photo = await Camera.getPhoto({
      quality:    80,
      resultType: CameraResultType.DataUrl,
      source:     CameraSource.Prompt,
    })
    if (!photo.dataUrl) return
    const res  = await fetch(photo.dataUrl)
    const blob = await res.blob()
    const form = new FormData()
    form.append('file', blob, `photo_${Date.now()}.jpg`)
    const { data } = await api.post<{ url: string }>('/api/upload', form)
    await api.post('/api/messages', { channelId, content: data.url })
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '8px 12px',
        paddingBottom: 'calc(8px + var(--safe-bottom))',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      <button onClick={handleAttach} style={{ color: 'var(--text-muted)', padding: 8 }}>
        <Paperclip size={20} />
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Message…"
        rows={1}
        style={{
          flex: 1, resize: 'none',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '10px 14px',
          color: 'var(--text-primary)', fontSize: 14,
          lineHeight: 1.4, maxHeight: 120, overflowY: 'auto',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
        }}
      />
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        style={{
          background: 'var(--yellow)', color: '#000',
          borderRadius: 10, padding: 10,
          opacity: !text.trim() || sending ? 0.4 : 1,
        }}
      >
        <Send size={18} />
      </button>
    </div>
  )
}
