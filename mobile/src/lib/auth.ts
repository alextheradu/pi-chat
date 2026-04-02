import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { Preferences } from '@capacitor/preferences'
import { api } from './api'

export type MobileUser = {
  id: string
  email: string
  name: string
  role: string
  picture?: string
}

export async function signInWithGoogle(): Promise<MobileUser> {
  await GoogleAuth.initialize()
  const googleUser = await GoogleAuth.signIn()
  const idToken = googleUser.authentication.idToken

  const { data } = await api.post<{ token: string; user: MobileUser }>(
    '/api/auth/mobile-signin',
    { idToken }
  )
  await Preferences.set({ key: 'jwt', value: data.token })
  return data.user
}

export async function signOut(): Promise<void> {
  await GoogleAuth.signOut()
  await Preferences.remove({ key: 'jwt' })
  await Preferences.remove({ key: 'theme' })
}

export async function getStoredJwt(): Promise<string | null> {
  const { value } = await Preferences.get({ key: 'jwt' })
  return value
}
