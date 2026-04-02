const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return false
  }
  if (entry.count >= limit) return true
  entry.count++
  return false
}
