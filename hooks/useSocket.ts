'use client'

import { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket-client'
import type { Socket } from 'socket.io-client'

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const socket = getSocket()

  useEffect(() => {
    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    if (socket.connected) setIsConnected(true)
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect) }
  }, [socket])

  return { socket, isConnected }
}
