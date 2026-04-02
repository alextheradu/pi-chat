import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ThemeToggle } from '@/components/settings/ThemeToggle'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div style={{ padding: '32px 24px', maxWidth: 600 }}>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 32,
          fontFamily: 'var(--font-mono)',
        }}
      >
        Settings
      </h1>

      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Appearance
        </h2>
        <ThemeToggle />
      </section>

      <section>
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}
        >
          Account
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Signed in as{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--yellow-dim)',
              color: 'var(--yellow)',
              padding: '0.1em 0.4em',
              borderRadius: 4,
            }}
          >
            {session.user.email}
          </code>
        </p>
      </section>
    </div>
  )
}
