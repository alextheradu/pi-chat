'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { motion, useReducedMotion } from 'framer-motion'
import { Smile, Reply, Pin, Pencil, Trash2 } from 'lucide-react'
import type { Role } from '@prisma/client'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { MessageReactions } from './MessageReactions'
import { sanitizeMessageHtml, highlightMentions } from '@/lib/sanitize'
import type { Message } from '@/hooks/useMessages'

interface MessageItemProps {
  message: Message
  isGrouped: boolean
  currentUserId: string
  currentUserRole: Role
  currentUserName?: string
  onReply: (id: string) => void
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  onPin: (id: string) => void
}

const ROLE_BADGE: Partial<Record<Role, string>> = { ADMIN: 'ADMIN', MODERATOR: 'MOD', SUBDIVISION_LEAD: 'LEAD' }

export function MessageItem({ message, isGrouped, currentUserId, currentUserRole, currentUserName, onReply, onReact, onEdit, onDelete, onPin }: MessageItemProps) {
  const [hovered, setHovered] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const isOwn = message.authorId === currentUserId
  const canDelete = isOwn || currentUserRole === 'ADMIN' || currentUserRole === 'MODERATOR'
  const canPin = ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'].includes(currentUserRole)

  const reactionMap = new Map<string, { count: number; hasReacted: boolean }>()
  for (const r of message.reactions) {
    const e = reactionMap.get(r.emoji) ?? { count: 0, hasReacted: false }
    reactionMap.set(r.emoji, { count: e.count + 1, hasReacted: e.hasReacted || r.userId === currentUserId })
  }
  const reactions = Array.from(reactionMap.entries()).map(([emoji, v]) => ({ emoji, ...v }))

  // safeHtml is DOMPurify-sanitized output from lib/sanitize.ts
  const safeHtml = highlightMentions(sanitizeMessageHtml(message.content), currentUserName)

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 12, padding: isGrouped ? '2px 16px' : '8px 16px', position: 'relative' }}
    >
      <div style={{ width: 32, flexShrink: 0 }}>
        {!isGrouped && (
          <UserAvatar userId={message.author.id} name={message.author.displayName ?? message.author.name} avatarUrl={message.author.avatarUrl} size={32} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!isGrouped && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {message.author.displayName ?? message.author.name}
            </span>
            {ROLE_BADGE[message.author.role as Role] && (
              <span style={{ background: 'var(--yellow)', color: 'var(--text-inverse)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                {ROLE_BADGE[message.author.role as Role]}
              </span>
            )}
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
            {message.isEdited && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
          </div>
        )}
        {/* safeHtml is DOMPurify-sanitized output from lib/sanitize.ts */}
        <div
          style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
        {reactions.length > 0 && <MessageReactions reactions={reactions} onReact={(emoji) => onReact(message.id, emoji)} />}
        {/* TODO Task 9: {message.poll && <PollCard pollId={message.poll.id} question={message.poll.question} options={message.poll.options} currentUserId={currentUserId} isAnonymous={message.poll.isAnonymous} endsAt={message.poll.endsAt} />} */}
      </div>

      {hovered && (
        <div style={{ position: 'absolute', top: 4, right: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '2px 4px', display: 'flex', gap: 2, zIndex: 10 }}>
          {[
            { icon: Smile, label: 'Add reaction', fn: () => {} },
            { icon: Reply, label: 'Reply in thread', fn: () => onReply(message.id) },
            ...(canPin ? [{ icon: Pin, label: 'Pin message', fn: () => onPin(message.id) }] : []),
            ...(isOwn ? [{ icon: Pencil, label: 'Edit message', fn: () => onEdit(message.id, message.content) }] : []),
            ...(canDelete ? [{ icon: Trash2, label: 'Delete message', fn: () => onDelete(message.id) }] : []),
          ].map(({ icon: Icon, label, fn }) => (
            <button key={label} aria-label={label} onClick={fn} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, color: 'var(--text-muted)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
