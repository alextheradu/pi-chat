import { createHash, randomBytes } from 'node:crypto'

export function createIncomingWebhookToken() {
  const secret = randomBytes(24).toString('hex')
  const token = `pichat_wh_${secret}`

  return {
    token,
    tokenHash: hashIncomingWebhookToken(token),
    tokenPreview: `${token.slice(0, 16)}...`,
  }
}

export function hashIncomingWebhookToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function buildWebhookUrl(appUrl: string, token: string) {
  return `${appUrl.replace(/\/$/, '')}/api/hooks/${token}`
}
