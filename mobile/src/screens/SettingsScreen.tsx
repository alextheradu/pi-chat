import { useState } from 'react'
import { LogOut, User, Shield } from 'lucide-react'
import { signOut } from '../lib/auth'
import { useAuthStore } from '../store/auth'
import ThemeToggle from '../components/ThemeToggle'
import Avatar from '../components/Avatar'

type Props = { onSignOut: () => void }

export default function SettingsScreen({ onSignOut }: Props) {
  const { user } = useAuthStore()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut()
    onSignOut()
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Settings</h1>
      </div>

      {/* Profile */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Avatar
          src={user?.picture}
          name={user?.name ?? '?'}
          size={52}
        />
        <div>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {user?.name}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {user?.email}
          </p>
        </div>
      </div>

      {/* Role badge */}
      {user?.role && user.role !== 'MEMBER' && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <Shield size={16} color="var(--yellow)" />
          <span style={{ fontSize: 14, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          </span>
        </div>
      )}

      {/* Appearance */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Appearance
        </p>
        <ThemeToggle />
      </div>

      {/* Account section */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Account
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <User size={16} color="var(--text-muted)" />
          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            {user?.email}
          </span>
        </div>
      </div>

      {/* Sign out */}
      <div style={{ padding: '20px 16px' }}>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '14px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            color: 'var(--danger)',
            fontSize: 15, fontWeight: 500,
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          <LogOut size={18} />
          {signingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  )
}
