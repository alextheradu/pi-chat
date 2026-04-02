import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

type Channel = { id: string; name: string; slug: string; isPrivate: boolean }

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn:  async () => {
      const { data } = await api.get<{ channels: Channel[] }>('/api/channels')
      return data.channels
    },
  })
}
