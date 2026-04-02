import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { siteConfig } from '@/lib/site-config'

export type SiteDoc = {
  slug: string
  title: string
  description: string
  filename: string
  sectionId: string
}

export type SiteDocSection = {
  id: string
  title: string
  docs: SiteDoc[]
}

const docsRoot = path.join(process.cwd(), 'content', 'docs')

export const siteDocs: SiteDoc[] = [
  // Getting Started
  {
    slug: 'overview',
    title: 'Overview',
    description: `What ${siteConfig.appName} is, why it exists, and what it ships today.`,
    filename: 'overview.md',
    sectionId: 'getting-started',
  },
  {
    slug: 'getting-started',
    title: 'Installation',
    description: `Clone the repo, configure your environment, run migrations, and start ${siteConfig.appName} locally.`,
    filename: 'getting-started.md',
    sectionId: 'getting-started',
  },
  {
    slug: 'configuration',
    title: 'Configuration',
    description: 'All environment variables: database, auth, Google OAuth, storage, and branding.',
    filename: 'configuration.md',
    sectionId: 'getting-started',
  },

  // Deployment
  {
    slug: 'self-hosting',
    title: 'Self-Hosting',
    description: `Run ${siteConfig.appName} in production with Docker Compose, Postgres, and MinIO.`,
    filename: 'self-hosting.md',
    sectionId: 'deployment',
  },
  {
    slug: 'operations',
    title: 'Operations',
    description: 'Build, lint, type-check, migrate, seed, Docker commands, and health verification.',
    filename: 'operations.md',
    sectionId: 'deployment',
  },

  // Features
  {
    slug: 'authentication',
    title: 'Authentication',
    description: `Who can sign in, how invited outsiders are handled, and how the domain restriction works.`,
    filename: 'authentication.md',
    sectionId: 'features',
  },
  {
    slug: 'integrations-and-bots',
    title: 'Integrations and Bots',
    description: 'Incoming webhooks, bot identities, the delivery API, and how external apps post messages.',
    filename: 'integrations-and-bots.md',
    sectionId: 'features',
  },

  // Reference
  {
    slug: 'architecture',
    title: 'Architecture',
    description: `How the Next.js, Prisma, Postgres, and MinIO layers fit together and handle requests.`,
    filename: 'architecture.md',
    sectionId: 'reference',
  },
  {
    slug: 'data-model',
    title: 'Data Model',
    description: 'The Prisma schema: users, channels, messages, reactions, DMs, tasks, webhooks, and more.',
    filename: 'data-model.md',
    sectionId: 'reference',
  },
  {
    slug: 'routes-and-pages',
    title: 'Routes and Pages',
    description: 'Public routes, protected app routes, API endpoints, and route protection middleware.',
    filename: 'routes-and-pages.md',
    sectionId: 'reference',
  },
  {
    slug: 'repository-tour',
    title: 'Repository Structure',
    description: 'A guide to the important folders, files, scripts, and how the repo is organized.',
    filename: 'repository-tour.md',
    sectionId: 'reference',
  },

  // Project
  {
    slug: 'roadmap',
    title: 'Roadmap',
    description: 'What is already shipped and what the later product phases are planned to add.',
    filename: 'roadmap.md',
    sectionId: 'project',
  },
]

const sectionDefinitions = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'deployment',      title: 'Deployment' },
  { id: 'features',        title: 'Features' },
  { id: 'reference',       title: 'Reference' },
  { id: 'project',         title: 'Project' },
] as const

export const siteDocSections: SiteDocSection[] = sectionDefinitions.map((section) => ({
  id: section.id,
  title: section.title,
  docs: siteDocs.filter((doc) => doc.sectionId === section.id),
}))

export function getSiteDoc(slug: string) {
  return siteDocs.find((doc) => doc.slug === slug)
}

export async function getSiteDocContent(slug: string) {
  const doc = getSiteDoc(slug)

  if (!doc) {
    return null
  }

  const content = await readFile(path.join(docsRoot, doc.filename), 'utf8')

  return {
    ...doc,
    content,
  }
}
