import Link from 'next/link'

import { siteConfig } from '@/lib/site-config'

export function PublicNavbar() {
  return (
    <header className="docs-topbar">
      <Link href="/" className="docs-topbar-brand">
        {siteConfig.appName}
      </Link>
      <div className="docs-topbar-links">
        <Link href="/" className="docs-topbar-link">
          Website
        </Link>
        <Link href="/docs/" className="docs-topbar-link">
          Docs
        </Link>
        <a
          href={siteConfig.repositoryUrl}
          target="_blank"
          rel="noreferrer"
          className="docs-topbar-link docs-topbar-link-accent"
        >
          Repository
        </a>
      </div>
    </header>
  )
}
