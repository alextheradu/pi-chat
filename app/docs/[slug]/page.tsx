import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { DocsShell } from '@/components/DocsShell'
import { renderDocMarkdown } from '@/lib/docs-render'
import { getSiteDoc, getSiteDocContent, siteDocs } from '@/lib/docs'
import { siteConfig } from '@/lib/site-config'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return siteDocs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const doc = getSiteDoc(slug)

  if (!doc) {
    return {
      title: `Docs | ${siteConfig.appName}`,
    }
  }

  return {
    title: `${doc.title} | ${siteConfig.appName} Docs`,
    description: doc.description,
  }
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params
  const doc = await getSiteDocContent(slug)

  if (!doc) {
    notFound()
  }

  const rendered = await renderDocMarkdown(doc.content)

  return (
    <DocsShell
      currentSlug={doc.slug}
      pageTitle={doc.title}
      pageDescription={doc.description}
      tocTitle="Table of contents"
      tocItems={rendered.toc}
    >
      <article className="docs-article">
        <div className="docs-markdown" dangerouslySetInnerHTML={{ __html: rendered.html }} />
      </article>
    </DocsShell>
  )
}
