import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

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
    >
      <body style={{ background: 'var(--bg-base)' }}>
        {children}
      </body>
    </html>
  )
}
