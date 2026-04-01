'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSocket } from './useSocket'

export interface MessageAuthor {
  id: string; name: string; displayName: string | null; avatarUrl: string | null; role: string
}
export interface Message {
  id: string; content: string; authorId: string; channelId: string; threadId: string | null
  isEdited: boolean; isDeleted: boolean; createdAt: string; updatedAt: string
  author: MessageAuthor; attachments: unknown[]
  reactions: { emoji: string; userId: string }[]
  _count: { replies: number }
  poll?: {
    id: string; question: string; isAnonymous: boolean; endsAt: string | null
    options: { id: string; text: string; votes: { userId: string }[] }[]
  } | null
}

async function fetchMessages(channelId: string, cursor?: string) {
  const params = new URLSearchParams({ channelId })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/messages?${params}`)
  if (!res.ok) throw new Error('Failed to fetch messages')
  return res.json() as Promise<{ messages: Message[]; nextCursor: string | null }>
}

export function useMessages(channelId: string) {
  const queryClient = useQueryClient()
  const { socket } = useSocket()

  const query = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) => fetchMessages(channelId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (firstPage) => firstPage.nextCursor ?? undefined,
  })

  useEffect(() => {
    const onNew = ({ message }: { message: Message }) => {
      if (message.channelId !== channelId) return
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map((page, i) =>
          i === old.pages.length - 1 ? { ...page, messages: [...page.messages, message] } : page
        )
        return { ...old, pages }
      })
    }
    const onEdit = ({ messageId, content }: { messageId: string; content: string }) => {
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map(page => ({
          ...page,
          messages: page.messages.map(m => m.id === messageId ? { ...m, content, isEdited: true } : m),
        }))
        return { ...old, pages }
      })
    }
    const onDelete = ({ messageId }: { messageId: string }) => {
      queryClient.setQueryData(['messages', channelId], (old: typeof query.data) => {
        if (!old) return old
        const pages = old.pages.map(page => ({
          ...page,
          messages: page.messages.filter(m => m.id !== messageId),
        }))
        return { ...old, pages }
      })
    }
    socket.on('message:new', onNew)
    socket.on('message:edit', onEdit)
    socket.on('message:delete', onDelete)
    return () => { socket.off('message:new', onNew); socket.off('message:edit', onEdit); socket.off('message:delete', onDelete) }
  }, [socket, channelId, queryClient])

  return {
    messages: query.data?.pages.flatMap(p => p.messages) ?? [],
    isLoading: query.isLoading,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
    isLoadingMore: query.isFetchingNextPage,
  }
}
