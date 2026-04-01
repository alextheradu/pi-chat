// lib/sanitize.ts
// Central HTML sanitization utility for user-generated message content.
// ALL message HTML must pass through sanitizeMessageHtml() before rendering.
// Never pass raw user content to dangerouslySetInnerHTML directly.

let dompurify: DOMPurify.DOMPurifyI | null = null

function getDOMPurify(): DOMPurify.DOMPurifyI | null {
  if (typeof window === 'undefined') return null
  if (!dompurify) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const createDOMPurify = require('dompurify') as (win: Window) => DOMPurify.DOMPurifyI
    dompurify = createDOMPurify(window)
  }
  return dompurify
}

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 's', 'u', 'code', 'pre', 'blockquote', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'span', 'div']

export function sanitizeMessageHtml(rawHtml: string): string {
  const purify = getDOMPurify()
  if (!purify) return ''
  return purify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-mention-id'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    FORCE_BODY: true,
    ADD_ATTR: ['target'],
  })
}

export function highlightMentions(sanitizedHtml: string, currentUsername?: string): string {
  return sanitizedHtml.replace(
    /@(\w+)/g,
    (_match, username: string) => {
      const isSelf = currentUsername && username.toLowerCase() === currentUsername.toLowerCase()
      return `<span class="mention${isSelf ? ' mention-self' : ''}" data-mention-id="${username}">@${username}</span>`
    }
  )
}
