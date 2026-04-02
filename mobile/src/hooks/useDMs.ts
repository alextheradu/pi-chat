import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

type DMThread = {
  id: string
  partnerId: string
  partnerName: string
  partnerAvatar?: string
  lastMessage?: string
  lastAt?: string
}

export function useDMs() {
  return useQuery<DMThread[]>({
    queryKey: ['dms'],
    queryFn:  async () => {
      const { data } = await api.get<{ dms: DMThread[] }>('/api/dm')
      return data.dms
    },
  })
}
