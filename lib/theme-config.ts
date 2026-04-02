/**
 * Color palette — every value can be overridden via environment variable.
 * These are read at server start and injected into the page as CSS custom
 * properties by <ThemeVars /> in app/layout.tsx.
 *
 * Example .env overrides:
 *   ACCENT_COLOR=#3b82f6    ← swap yellow accent for blue
 *   BG_BASE=#0a0a0a         ← deeper black background
 */
export const themeConfig = {
  accentColor:   process.env.ACCENT_COLOR    ?? '#f5c518',
  accentHover:   process.env.ACCENT_HOVER    ?? '#fcd73a',
  bgBase:        process.env.BG_BASE         ?? '#0c0c0e',
  bgSurface:     process.env.BG_SURFACE      ?? '#111115',
  bgElevated:    process.env.BG_ELEVATED     ?? '#18181f',
  bgHover:       process.env.BG_HOVER        ?? '#1e1e26',
  bgActive:      process.env.BG_ACTIVE       ?? '#222230',
  borderSubtle:  process.env.BORDER_SUBTLE   ?? '#1a1a22',
  borderDefault: process.env.BORDER_DEFAULT  ?? '#2a2a34',
  borderStrong:  process.env.BORDER_STRONG   ?? '#3a3a48',
  textPrimary:   process.env.TEXT_PRIMARY    ?? '#f0f0f4',
  textSecondary: process.env.TEXT_SECONDARY  ?? '#8b8b9a',
  textMuted:     process.env.TEXT_MUTED      ?? '#52525e',
  textInverse:   process.env.TEXT_INVERSE    ?? '#0c0c0e',
}
