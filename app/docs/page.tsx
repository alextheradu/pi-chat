import Link from 'next/link'

import { DocsShell } from '@/components/DocsShell'
import { siteConfig } from '@/lib/site-config'

export const metadata = {
  title: `Docs | ${siteConfig.appName}`,
  description: `Documentation for ${siteConfig.appName}: installation, configuration, self-hosting, architecture, and more.`,
}

export default function DocsIndexPage() {
  return (
    <DocsShell
      pageTitle={`${siteConfig.appName} Documentation`}
      pageDescription="Everything you need to install, configure, deploy, and understand Pi-Chat."
      tocTitle="On this page"
      tocItems={[
        { id: 'getting-started', level: 2, text: 'Getting started' },
        { id: 'deployment',      level: 2, text: 'Deployment' },
        { id: 'features',        level: 2, text: 'Features' },
        { id: 'reference',       level: 2, text: 'Reference' },
      ]}
    >
      <div className="docs-surface">

        <section id="getting-started" className="docs-overview-panel">
          <p className="docs-overview-label">Getting started</p>
          <p className="docs-overview-copy">
            New to Pi-Chat? Start with the overview to understand what it is and who it is
            for, then follow the installation guide to get a local instance running.
          </p>
          <div className="docs-start-grid">
            <Link href="/docs/overview/" className="docs-start-card">
              <span className="docs-start-label">Intro</span>
              <strong className="docs-start-title">Overview</strong>
              <span className="docs-start-copy">
                What Pi-Chat is, why it exists, and what it ships today.
              </span>
            </Link>
            <Link href="/docs/getting-started/" className="docs-start-card">
              <span className="docs-start-label">Setup</span>
              <strong className="docs-start-title">Installation</strong>
              <span className="docs-start-copy">
                Clone, configure, migrate, and run Pi-Chat locally in minutes.
              </span>
            </Link>
            <Link href="/docs/configuration/" className="docs-start-card">
              <span className="docs-start-label">Config</span>
              <strong className="docs-start-title">Configuration</strong>
              <span className="docs-start-copy">
                Every environment variable: database, auth, storage, and branding.
              </span>
            </Link>
          </div>
        </section>

        <section id="deployment" className="docs-overview-panel" style={{ marginTop: '2rem' }}>
          <p className="docs-overview-label">Deployment</p>
          <p className="docs-overview-copy">
            Run Pi-Chat in production with Docker Compose. One command brings up the full
            stack: app, database, and object storage.
          </p>
          <div className="docs-start-grid">
            <Link href="/docs/self-hosting/" className="docs-start-card">
              <span className="docs-start-label">Deploy</span>
              <strong className="docs-start-title">Self-Hosting</strong>
              <span className="docs-start-copy">
                Production setup with Docker Compose, reverse proxy, and health checks.
              </span>
            </Link>
            <Link href="/docs/operations/" className="docs-start-card">
              <span className="docs-start-label">Ops</span>
              <strong className="docs-start-title">Operations</strong>
              <span className="docs-start-copy">
                Build, lint, migrate, seed, Docker commands, and smoke tests.
              </span>
            </Link>
          </div>
        </section>

        <section id="features" className="docs-overview-panel" style={{ marginTop: '2rem' }}>
          <p className="docs-overview-label">Features</p>
          <div className="docs-start-grid">
            <Link href="/docs/authentication/" className="docs-start-card">
              <span className="docs-start-label">Security</span>
              <strong className="docs-start-title">Authentication</strong>
              <span className="docs-start-copy">
                Domain restriction, invite flow, banned users, and bootstrap admin.
              </span>
            </Link>
            <Link href="/docs/integrations-and-bots/" className="docs-start-card">
              <span className="docs-start-label">Integrations</span>
              <strong className="docs-start-title">Webhooks and Bots</strong>
              <span className="docs-start-copy">
                Post messages from external apps, CI pipelines, and monitoring tools.
              </span>
            </Link>
          </div>
        </section>

        <section id="reference" className="docs-overview-panel" style={{ marginTop: '2rem' }}>
          <p className="docs-overview-label">Reference</p>
          <div className="docs-start-grid">
            <Link href="/docs/architecture/" className="docs-start-card">
              <span className="docs-start-label">Internals</span>
              <strong className="docs-start-title">Architecture</strong>
              <span className="docs-start-copy">
                How the Next.js, Prisma, Postgres, and MinIO layers fit together.
              </span>
            </Link>
            <Link href="/docs/data-model/" className="docs-start-card">
              <span className="docs-start-label">Schema</span>
              <strong className="docs-start-title">Data Model</strong>
              <span className="docs-start-copy">
                Users, channels, messages, DMs, tasks, webhooks, and more.
              </span>
            </Link>
            <Link href="/docs/routes-and-pages/" className="docs-start-card">
              <span className="docs-start-label">API</span>
              <strong className="docs-start-title">Routes and Pages</strong>
              <span className="docs-start-copy">
                Public routes, protected app routes, and API endpoints.
              </span>
            </Link>
            <Link href="/docs/repository-tour/" className="docs-start-card">
              <span className="docs-start-label">Codebase</span>
              <strong className="docs-start-title">Repository Structure</strong>
              <span className="docs-start-copy">
                A map of every important folder, file, and script in the repo.
              </span>
            </Link>
          </div>
        </section>

      </div>
    </DocsShell>
  )
}
