import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'

import { PageTransition } from '@/components/PageTransition'
import { PublicNavbar } from '@/components/PublicNavbar'
import { siteConfig } from '@/lib/site-config'

import './globals.css'

const sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '700'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: `${siteConfig.appName} | Public Site`,
  description: `${siteConfig.appName} public website and documentation.`,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <PublicNavbar />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  )
}
