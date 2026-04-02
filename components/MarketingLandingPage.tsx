import Link from 'next/link'

import { siteDocSections } from '@/lib/docs'
import { siteConfig } from '@/lib/site-config'

export function MarketingLandingPage() {
  const featuredDocs = siteDocSections.flatMap((section) => section.docs).slice(0, 4)

  return (
    <main className="site-page">
      <div className="site-container">

        {/* Hero */}
        <section className="site-hero-panel">
          <div className="site-hero-left">
            <p className="docs-page-eyebrow">Open Source / Self-Hosted</p>
            <h1 className="site-hero-title">{siteConfig.appName}</h1>
            <p className="docs-page-description" style={{ marginBottom: '1.5rem' }}>
              A Slack alternative you run on your own infrastructure. Your messages, your data,
              your server. No SaaS lock-in, no vendor dependency, no data leaving your network.
            </p>
            <div className="docs-overview-actions">
              <a
                href={siteConfig.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="docs-pill-primary"
              >
                View on GitHub
              </a>
              <Link href="/docs/" className="docs-pill-muted">
                Read the docs
              </Link>
            </div>
          </div>

          <div className="site-hero-right">
            <div className="site-terminal">
              <div className="site-terminal-bar">
                <span className="site-terminal-dot site-terminal-dot-red" />
                <span className="site-terminal-dot site-terminal-dot-yellow" />
                <span className="site-terminal-dot site-terminal-dot-green" />
                <span className="site-terminal-title">bash</span>
              </div>
              <div className="site-terminal-body">
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">
                    git clone https://github.com/alextheradu/pi-chat.git
                  </span>
                </div>
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">cd pi-chat && cp .env.example .env</span>
                </div>
                <div className="site-terminal-blank" />
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">docker compose -f docker-compose.dev.yml up -d</span>
                </div>
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">npm install && npm run db:migrate:deploy</span>
                </div>
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">npm run dev</span>
                </div>
                <div className="site-terminal-blank" />
                <div className="site-terminal-line">
                  <span className="site-terminal-prompt">$</span>
                  <span className="site-terminal-cmd">
                    open http://localhost:3001{' '}
                    <span className="site-terminal-cursor" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="site-features">
          <div className="site-feature-card">
            <span className="site-feature-label">Channels</span>
            <strong className="site-feature-title">Team messaging</strong>
            <span className="site-feature-copy">
              Channels, direct messages, and group DMs. Role-based access so the right people
              see the right conversations.
            </span>
          </div>
          <div className="site-feature-card">
            <span className="site-feature-label">Auth</span>
            <strong className="site-feature-title">Domain-restricted sign-in</strong>
            <span className="site-feature-copy">
              Google OAuth locked to your domain. Outsiders need an admin-issued invite.
              Banned accounts are blocked regardless.
            </span>
          </div>
          <div className="site-feature-card">
            <span className="site-feature-label">Integrations</span>
            <strong className="site-feature-title">Incoming webhooks</strong>
            <span className="site-feature-copy">
              Connect CI pipelines, monitoring tools, and bots. Each webhook gets its own
              bot identity and posts to a target channel.
            </span>
          </div>
          <div className="site-feature-card">
            <span className="site-feature-label">Deployment</span>
            <strong className="site-feature-title">Docker + Postgres + MinIO</strong>
            <span className="site-feature-copy">
              One{' '}
              <code style={{ fontSize: '0.85em' }}>docker compose up</code>{' '}
              to run the full stack. Migrations, bucket setup, and seeding happen automatically.
            </span>
          </div>
        </section>

        {/* Start reading */}
        <section className="docs-surface">
          <h2 className="docs-repo-title">Documentation</h2>
          <div className="docs-start-grid">
            {featuredDocs.map((doc) => (
              <Link key={doc.slug} href={`/docs/${doc.slug}/`} className="docs-start-card">
                <span className="docs-start-label">{doc.sectionId}</span>
                <strong className="docs-start-title">{doc.title}</strong>
                <span className="docs-start-copy">{doc.description}</span>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
