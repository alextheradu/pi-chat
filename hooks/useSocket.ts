'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket-client'

export function useSocket() {
  const socket = getSocket()
  const [isConnected, setIsConnected] = useState(() => socket.connected)

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  return { socket, isConnected }
}
