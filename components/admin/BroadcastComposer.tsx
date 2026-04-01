'use client'
import { Send } from 'lucide-react'
export function BroadcastComposer() {
  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Target</div>
        <select style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13, marginBottom: 12, width: '100%' }}>
          <option value="all">All Members</option>
        </select>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Message</div>
        <textarea placeholder="Write your announcement..." rows={6} style={{ width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }} />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
            <Send size={14} /> Send Broadcast
          </button>
        </div>
      </div>
    </div>
  )
}
