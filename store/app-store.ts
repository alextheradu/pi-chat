import { create } from 'zustand'

interface AppStore {
  activeChannelId: string | null
  activeDMId: string | null
  setActiveChannelId: (id: string | null) => void
  setActiveDMId: (id: string | null) => void
  threadParentId: string | null
  setThreadParentId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  unreadCounts: Record<string, number>
  setUnreadCount: (channelId: string, count: number) => void
  clearUnread: (channelId: string) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  activeChannelId: null,
  activeDMId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  setActiveDMId: (id) => set({ activeDMId: id }),
  threadParentId: null,
  setThreadParentId: (id) => set({ threadParentId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  unreadCounts: {},
  setUnreadCount: (channelId, count) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [channelId]: count } })),
  clearUnread: (channelId) =>
    set((s) => {
      const next = { ...s.unreadCounts }
      delete next[channelId]
      return { unreadCounts: next }
    }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}))
