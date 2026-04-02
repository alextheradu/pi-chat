import { useState } from 'react'
import { signInWithGoogle, type MobileUser } from '../lib/auth'

type Props = { onSuccess: (user: MobileUser) => void }

export default function AuthScreen({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      const user = await signInWithGoogle()
      onSuccess(user)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: '0 32px', gap: 24,
      }}
    >
      <div style={{ fontSize: 64, lineHeight: 1 }}>π</div>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
          {import.meta.env.VITE_APP_NAME ?? 'TeamChat'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8 }}>
          Team communication — self-hosted
        </p>
      </div>

      <button
        onClick={handleSignIn}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 24px',
          background: 'var(--yellow)', color: '#000',
          borderRadius: 12, fontWeight: 600, fontSize: 15,
          opacity: loading ? 0.6 : 1,
          width: '100%', justifyContent: 'center', maxWidth: 320,
        }}
      >
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{error}</p>
      )}
    </div>
  )
}
