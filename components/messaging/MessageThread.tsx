'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, MessageSquare } from 'lucide-react'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import type { Role } from '@prisma/client'
import type { Message } from '@/hooks/useMessages'

interface MessageThreadProps {
  parentId: string | null
  channelId: string
  currentUserId: string
  currentUserRole: Role
  currentUserName: string
  onClose: () => void
}

export function MessageThread({ parentId, channelId, currentUserId, currentUserRole, currentUserName, onClose }: MessageThreadProps) {
  const [replies, setReplies] = useState<Message[]>([])
  const [parent, setParent] = useState<Message | null>(null)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (!parentId) return
    const controller = new AbortController()
    fetch(`/api/messages/${parentId}/replies`, { signal: controller.signal })
      .then(r => r.json() as Promise<{ parent: Message; replies: Message[] }>)
      .then(data => { setParent(data.parent); setReplies(data.replies) })
      .catch(e => { if ((e as Error).name !== 'AbortError') console.error(e) })
    return () => controller.abort()
  }, [parentId])

  return (
    <AnimatePresence>
      {parentId && (
        <motion.aside
          key="thread"
          initial={shouldReduceMotion ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { x: 0, opacity: 0 } : { x: 20, opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            width: 320, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)',
          }}
        >
          <div style={{ height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--border-subtle)', gap: 8, flexShrink: 0 }}>
            <MessageSquare size={16} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>Thread</span>
            <button aria-label="Close thread" onClick={onClose} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 6 }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {parent && (
              <div style={{ padding: '0 0 8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <MessageItem
                  message={parent} isGrouped={false}
                  currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserName={currentUserName}
                  onReply={() => {}} onReact={() => {}} onEdit={() => {}} onDelete={() => {}} onPin={() => {}}
                />
              </div>
            )}
            {replies.map(reply => (
              <MessageItem
                key={reply.id} message={reply} isGrouped={false}
                currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserName={currentUserName}
                onReply={() => {}} onReact={() => {}} onEdit={() => {}} onDelete={() => {}} onPin={() => {}}
              />
            ))}
          </div>

          <MessageComposer channelId={channelId} threadId={parentId ?? undefined} placeholder="Reply in thread..." />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
