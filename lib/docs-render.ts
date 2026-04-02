import { Marked } from 'marked'

export type DocTocItem = {
  id: string
  level: number
  text: string
}

function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=[\]{}|\\:;"'<>,.?/]/g, '')
    .replace(/\s+/g, '-')
}

export async function renderDocMarkdown(markdown: string) {
  const toc: DocTocItem[] = []
  const seenIds = new Map<string, number>()
  const marked = new Marked({ gfm: true })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens, this.parser.textRenderer).trim()
        const baseId = slugifyHeading(text) || `section-${toc.length + 1}`
        const nextCount = (seenIds.get(baseId) ?? 0) + 1
        seenIds.set(baseId, nextCount)
        const id = nextCount === 1 ? baseId : `${baseId}-${nextCount}`

        if (depth >= 2 && depth <= 3) {
          toc.push({ id, level: depth, text })
        }

        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`
      },
    },
  })

  const html = await marked.parse(markdown)

  return { html, toc }
}
