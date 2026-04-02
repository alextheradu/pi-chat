'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, SearchX, Hash, Lock } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { UserAvatar } from './UserAvatar'

interface SearchResult {
  messages: { id: string; content: string; channel: { id: string; name: string }; author: { id: string; name: string; displayName: string | null; avatarUrl: string | null } }[]
  channels: { id: string; name: string; isPrivate: boolean; description: string | null }[]
  people: { id: string; name: string; displayName: string | null; avatarUrl: string | null; role: string }[]
}

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setSearchOpen])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=all`)
      .then(r => r.json() as Promise<SearchResult>)
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const noResults = results && results.messages.length === 0 && results.channels.length === 0 && results.people.length === 0

  if (!searchOpen) return null

  return (
    <div
      role="dialog"
      aria-label="Search"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}
      onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false) }}
    >
      <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-default)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search messages, channels, people..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
          />
          {loading && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>...</span>}
          <button aria-label="Close search" onClick={() => setSearchOpen(false)} style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', borderRadius: 4 }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {noResults && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 8, color: 'var(--text-muted)' }}>
              <SearchX size={28} />
              <span style={{ fontSize: 13 }}>No results for &ldquo;{query}&rdquo;</span>
            </div>
          )}
          {results?.channels && results.channels.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Channels</div>
              {results.channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => { router.push(`/channel/${ch.id}`); setSearchOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {ch.isPrivate ? <Lock size={14} color="var(--text-muted)" /> : <Hash size={14} color="var(--text-muted)" />}
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{ch.name}</div>
                    {ch.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.description}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {results?.people && results.people.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>People</div>
              {results.people.map(person => (
                <div key={person.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                  <UserAvatar userId={person.id} name={person.displayName ?? person.name} avatarUrl={person.avatarUrl} size={28} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{person.displayName ?? person.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{person.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {results?.messages && results.messages.length > 0 && (
            <div>
              <div style={{ padding: '8px 16px 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Messages</div>
              {results.messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => { router.push(`/channel/${msg.channel.id}`); setSearchOpen(false) }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    #{msg.channel.name} · {msg.author.displayName ?? msg.author.name}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.content.replace(/<[^>]+>/g, '').slice(0, 100)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
