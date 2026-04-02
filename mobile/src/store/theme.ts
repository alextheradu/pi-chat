import { create } from 'zustand'
import { Preferences } from '@capacitor/preferences'

type ThemeMode = 'dark' | 'light' | 'system'

type ThemeState = {
  mode:    ThemeMode
  setMode: (m: ThemeMode) => Promise<void>
}

function applyTheme(mode: ThemeMode) {
  const resolved =
    mode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : mode
  document.documentElement.setAttribute('data-theme', resolved)
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  setMode: async (mode) => {
    await Preferences.set({ key: 'theme', value: mode })
    applyTheme(mode)
    set({ mode })
    // Best-effort server persist
    try {
      const { Preferences: P } = await import('@capacitor/preferences')
      const { value: jwt } = await P.get({ key: 'jwt' })
      if (jwt) {
        const { API_URL } = await import('../lib/api')
        await fetch(`${API_URL}/api/user/settings`, {
          method:  'PATCH',
          headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ theme: mode.toUpperCase() }),
        })
      }
    } catch { /* best effort */ }
  },
}))

export async function hydrateTheme() {
  const { value } = await Preferences.get({ key: 'theme' })
  const mode = (value as ThemeMode | null) ?? 'dark'
  useThemeStore.setState({ mode })
  applyTheme(mode)
}
