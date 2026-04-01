'use client'

import { useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import type { UserStatus } from '@prisma/client'

export function usePresence(initialStatuses: Record<string, UserStatus> = {}) {
  const { socket } = useSocket()
  const [statuses, setStatuses] = useState(initialStatuses)

  useEffect(() => {
    const handler = ({ userId, status }: { userId: string; status: UserStatus }) => {
      setStatuses(prev => ({ ...prev, [userId]: status }))
    }
    socket.on('presence:update', handler)
    return () => { socket.off('presence:update', handler) }
  }, [socket])

  return statuses
}
