'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSocket } from './useSocket'

export function useTyping(channelId: string) {
  const { socket } = useSocket()
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  useEffect(() => {
    const onStart = ({ userId, userName, channelId: cid }: { userId: string; userName: string; channelId: string }) => {
      if (cid !== channelId) return
      setTypingUsers(prev => ({ ...prev, [userId]: userName }))
    }
    const onStop = ({ userId, channelId: cid }: { userId: string; channelId: string }) => {
      if (cid !== channelId) return
      setTypingUsers(prev => { const n = { ...prev }; delete n[userId]; return n })
    }
    socket.on('typing:start', onStart)
    socket.on('typing:stop', onStop)
    return () => { socket.off('typing:start', onStart); socket.off('typing:stop', onStop) }
  }, [socket, channelId])

  const startTyping = useCallback(() => {
    socket.emit('typing:start', { channelId })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { channelId }), 3000)
  }, [socket, channelId])

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current)
    socket.emit('typing:stop', { channelId })
  }, [socket, channelId])

  const typingNames = Object.values(typingUsers)
  let typingText = ''
  if (typingNames.length === 1) typingText = `${typingNames[0]} is typing...`
  else if (typingNames.length === 2) typingText = `${typingNames[0]} and ${typingNames[1]} are typing...`
  else if (typingNames.length > 2) typingText = 'Several people are typing...'

  return { typingText, startTyping, stopTyping }
}
