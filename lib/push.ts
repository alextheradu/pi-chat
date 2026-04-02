import webpush from 'web-push'
import { prisma } from './prisma'

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:admin@team1676.org',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: { url: string }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192.png', badge: payload.badge ?? '/icons/icon-72.png' }),
      ).catch(async (err: { statusCode?: number }) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } })
        }
      })
    )
  )
}
