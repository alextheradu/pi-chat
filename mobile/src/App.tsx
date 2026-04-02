import { useEffect } from 'react'
import { getStoredJwt, type MobileUser } from './lib/auth'
import { registerPushNotifications } from './lib/push'
import { useAuthStore } from './store/auth'
import AuthScreen from './screens/AuthScreen'
import MainApp from './screens/MainApp'

export default function App() {
  const { user, isReady, setUser, setReady } = useAuthStore()

  useEffect(() => {
    getStoredJwt().then(async (jwt) => {
      if (jwt) {
        try {
          const payload = JSON.parse(atob(jwt.split('.')[1]))
          setUser({
            id:      payload.userId,
            email:   payload.email,
            name:    payload.email,
            role:    payload.role,
          })
          // Best-effort: register push after restoring session
          registerPushNotifications().catch(() => {})
        } catch {
          // Malformed JWT — treat as signed out
        }
      }
      setReady()
    })
  }, [setUser, setReady])

  if (!isReady) return null

  if (!user) {
    return (
      <AuthScreen
        onSuccess={(u: MobileUser) => {
          setUser(u)
          registerPushNotifications().catch(() => {})
        }}
      />
    )
  }

  return <MainApp />
}
