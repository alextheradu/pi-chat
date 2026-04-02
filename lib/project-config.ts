function normalizeOrigin(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback
  }

  return value.trim().replace(/\/+$/, '') || fallback
}

const appName = process.env.APP_NAME ?? 'Pi-Chat'
const allowedDomain = process.env.ALLOWED_DOMAIN ?? 'example.com'
const devPort = process.env.DEV_PORT ?? '3001'
const defaultAppOrigin = `http://localhost:${devPort}`
const appUrl = normalizeOrigin(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL,
  defaultAppOrigin
)
const appSlug =
  appName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app'

export const projectConfig = {
  appName,
  appSlug,
  devPort,
  teamName: process.env.TEAM_NAME ?? 'Your Team',
  teamMemberSingular: process.env.TEAM_MEMBER_SINGULAR ?? 'Member',
  teamMemberPlural: process.env.TEAM_MEMBER_PLURAL ?? 'Members',
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@example.com',
  allowedDomain,
  allowedDomainLabel: `@${allowedDomain}`,
  botEmailDomain: process.env.BOT_EMAIL_DOMAIN ?? `bots.${appSlug}.local`,
  appUrl,
}
