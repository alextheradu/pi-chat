import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500'],
})

export const viewport: Viewport = {
  themeColor: '#f5c518',
}

export const metadata: Metadata = {
  title: 'Pi-Chat — Team 1676',
  description: 'FRC Team 1676 · The Pascack Pi-oneers communication hub',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{ background: 'var(--bg-base)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
