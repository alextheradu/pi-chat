'use client'

import { useState } from 'react'
import { BarChart2 } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

interface PollOption { id: string; text: string; votes: { userId: string }[] }
interface PollCardProps {
  pollId: string; question: string; options: PollOption[]
  currentUserId: string; isAnonymous: boolean; endsAt: string | null
}

export function PollCard({ pollId, question, options, currentUserId, isAnonymous, endsAt }: PollCardProps) {
  const { socket } = useSocket()
  const [localOptions, setLocalOptions] = useState(options)

  const totalVotes = localOptions.reduce((sum, o) => sum + o.votes.length, 0)
  const userVotedOptionId = localOptions.find(o => o.votes.some(v => v.userId === currentUserId))?.id
  const maxVotes = Math.max(...localOptions.map(o => o.votes.length), 1)

  const vote = (optionId: string) => {
    socket.emit('poll:vote', { pollId, optionId })
    setLocalOptions(prev => prev.map(o => {
      let votes = o.votes.filter(v => v.userId !== currentUserId)
      if (o.id === optionId) votes = [...votes, { userId: currentUserId }]
      return { ...o, votes }
    }))
  }

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '12px 14px', maxWidth: 400, marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <BarChart2 size={14} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{question}</span>
      </div>
      {localOptions.map(opt => {
        const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0
        const isLeader = opt.votes.length === maxVotes && opt.votes.length > 0
        const isVoted = opt.id === userVotedOptionId
        return (
          <button
            key={opt.id}
            onClick={() => vote(opt.id)}
            aria-label={`Vote for ${opt.text}`}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: `1px solid ${isVoted ? 'var(--yellow-border)' : 'transparent'}`, borderRadius: 6, padding: '6px 8px', cursor: 'pointer', marginBottom: 4, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: isLeader ? 'rgba(245,197,24,0.3)' : 'var(--bg-hover)', borderRadius: 6, transition: 'width 200ms ease' }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{opt.text}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{opt.votes.length} ({pct}%)</span>
            </div>
          </button>
        )
      })}
      <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        {endsAt && ` · Ends ${new Date(endsAt).toLocaleDateString()}`}
        {isAnonymous && ' · Anonymous'}
      </div>
    </div>
  )
}
