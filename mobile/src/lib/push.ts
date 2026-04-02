import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { api } from './api'

export async function registerPushNotifications() {
  if (!Capacitor.isNativePlatform()) return

  const perm = await PushNotifications.requestPermissions()
  if (perm.receive !== 'granted') return

  await PushNotifications.register()

  PushNotifications.addListener('registration', async ({ value: pushToken }) => {
    const platform = Capacitor.getPlatform() as 'ios' | 'android'
    try {
      await api.post('/api/push/mobile-register', { pushToken, platform })
    } catch (e) {
      console.error('Push registration failed', e)
    }
  })

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received in foreground:', notification.title)
  })

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action.actionId)
  })
}
