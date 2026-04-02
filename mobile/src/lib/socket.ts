import { io, type Socket } from 'socket.io-client'
import { API_URL } from './api'
import { getStoredJwt } from './auth'

let socket: Socket | null = null

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket
  const jwt = await getStoredJwt()
  socket = io(API_URL, {
    auth:         { token: jwt },
    transports:   ['websocket'],
    reconnection: true,
  })
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
