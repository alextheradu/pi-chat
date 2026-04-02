import Link from 'next/link'
import type { ReactNode } from 'react'

import type { DocTocItem } from '@/lib/docs-render'
import { siteDocSections } from '@/lib/docs'
import { siteConfig } from '@/lib/site-config'

type DocsShellProps = {
  children: ReactNode
  currentSlug?: string
  pageTitle: string
  pageDescription: string
  tocTitle?: string
  tocItems?: DocTocItem[]
}

export function DocsShell({
  children,
  currentSlug,
  pageTitle,
  pageDescription,
  tocTitle = 'On this page',
  tocItems = [],
}: DocsShellProps) {
  return (
    <main className="docs-shell">
      <aside className="docs-sidebar">
        <div className="docs-sidebar-sticky">
          <Link href="/docs/" className="docs-brand-link">
            {siteConfig.appName} Docs
          </Link>
          <p className="docs-sidebar-copy">
            Public project documentation, setup details, and operational guidance.
          </p>

          <nav aria-label="Documentation">
            {siteDocSections.map((section) => (
              <div key={section.id} className="docs-nav-section">
                <h2 className="docs-nav-heading">{section.title}</h2>
                <ul className="docs-nav-list">
                  {section.docs.map((doc) => (
                    <li key={doc.slug}>
                      <Link
                        href={`/docs/${doc.slug}`}
                        className={
                          doc.slug === currentSlug ? 'docs-nav-link docs-nav-link-active' : 'docs-nav-link'
                        }
                      >
                        {doc.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <section className="docs-main">
        <header className="docs-page-header">
          <p className="docs-page-eyebrow">Documentation</p>
          <h1 className="docs-page-title">{pageTitle}</h1>
          <p className="docs-page-description">{pageDescription}</p>
        </header>
        {children}
      </section>

      <aside className="docs-toc">
        <div className="docs-toc-sticky">
          <h2 className="docs-toc-title">{tocTitle}</h2>
          {tocItems.length > 0 ? (
            <ul className="docs-toc-list">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={item.level === 3 ? 'docs-toc-link docs-toc-link-nested' : 'docs-toc-link'}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="docs-toc-empty">Select a document from the left to start reading.</p>
          )}
        </div>
      </aside>
    </main>
  )
}
