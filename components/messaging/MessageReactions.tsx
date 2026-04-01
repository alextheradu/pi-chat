'use client'
import { Smile } from 'lucide-react'

interface Reaction { emoji: string; count: number; hasReacted: boolean }
interface MessageReactionsProps { reactions: Reaction[]; onReact: (emoji: string) => void }

export function MessageReactions({ reactions, onReact }: MessageReactionsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, alignItems: 'center' }}>
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          aria-label={`React with ${r.emoji} (${r.count})`}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: r.hasReacted ? 'var(--yellow-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${r.hasReacted ? 'var(--yellow-border)' : 'var(--border-default)'}`,
            borderRadius: 10, padding: '2px 6px', cursor: 'pointer', fontSize: 13,
          }}
        >
          <span>{r.emoji}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{r.count}</span>
        </button>
      ))}
      <button aria-label="Add reaction" style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6 }}>
        <Smile size={14} />
      </button>
    </div>
  )
}
