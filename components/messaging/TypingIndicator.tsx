'use client'
import { useReducedMotion } from 'framer-motion'

export function TypingIndicator({ typingText }: { typingText: string }) {
  const reduce = useReducedMotion()
  if (!typingText) return <div style={{ height: 24 }} />
  return (
    <div style={{ height: 24, display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px' }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: reduce ? 'none' : `typing-dot 1s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>{typingText}</span>
    </div>
  )
}
