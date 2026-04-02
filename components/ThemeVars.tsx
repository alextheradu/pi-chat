import { themeConfig } from '@/lib/theme-config'

/**
 * Server component — renders a <style> tag in <head> that overrides CSS
 * custom properties with env-var values. Because it runs only on the server,
 * there is no client-side JS cost and values are baked into the HTML stream.
 */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(245,197,24,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

export function ThemeVars() {
  const t = themeConfig
  const css = `:root {
  --yellow:        ${t.accentColor};
  --yellow-hover:  ${t.accentHover};
  --yellow-dim:    ${hexToRgba(t.accentColor, 0.12)};
  --yellow-border: ${hexToRgba(t.accentColor, 0.25)};
  --yellow-glow:   ${hexToRgba(t.accentColor, 0.06)};
  --bg-base:       ${t.bgBase};
  --bg-surface:    ${t.bgSurface};
  --bg-elevated:   ${t.bgElevated};
  --bg-hover:      ${t.bgHover};
  --bg-active:     ${t.bgActive};
  --border-subtle:  ${t.borderSubtle};
  --border-default: ${t.borderDefault};
  --border-strong:  ${t.borderStrong};
  --text-primary:   ${t.textPrimary};
  --text-secondary: ${t.textSecondary};
  --text-muted:     ${t.textMuted};
  --text-inverse:   ${t.textInverse};
}`
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
