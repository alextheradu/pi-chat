import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '../lib/api'
import { getSocket } from '../lib/socket'

type Message = {
  id: string; content: string; createdAt: string; isDeleted: boolean
  author: { id: string; name: string; displayName?: string; avatarUrl?: string }
}

export function useMessages(channelId: string) {
  const queryClient = useQueryClient()
  const key = ['messages', channelId]

  const query = useQuery<Message[]>({
    queryKey: key,
    queryFn:  async () => {
      const { data } = await api.get<{ messages: Message[] }>(`/api/messages?channelId=${channelId}`)
      return data.messages
    },
    enabled: !!channelId,
  })

  useEffect(() => {
    if (!channelId) return
    let mounted = true
    getSocket().then((socket) => {
      socket.emit('join-channel', channelId)
      socket.on('new-message', (msg: Message) => {
        if (!mounted) return
        queryClient.setQueryData<Message[]>(key, (old) => [...(old ?? []), msg])
      })
    })
    return () => {
      mounted = false
      getSocket().then((s) => {
        s.emit('leave-channel', channelId)
        s.off('new-message')
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  return query
}
