import { BroadcastComposer } from '@/components/admin/BroadcastComposer'

export default function AdminBroadcastPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>Broadcast</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, fontFamily: 'var(--font-sans)' }}>
        Send an announcement to all members or a specific group.
      </p>
      <BroadcastComposer />
    </div>
  )
}
