import { create } from 'zustand'
import type { MobileUser } from '../lib/auth'

type AuthState = {
  user:     MobileUser | null
  isReady:  boolean
  setUser:  (u: MobileUser | null) => void
  setReady: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user:     null,
  isReady:  false,
  setUser:  (user) => set({ user }),
  setReady: () => set({ isReady: true }),
}))
