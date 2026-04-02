'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import {
  motion,
  useReducedMotion,
  type Easing,
  type HTMLMotionProps,
} from 'framer-motion'
import { ShieldCheck, AlertCircle, Ban } from 'lucide-react'
import { Suspense, useState } from 'react'

type LoginPageClientProps = {
  allowedDomainLabel: string
  appName: string
  teamMemberSingular: string
  teamName: string
}

function GoogleGSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  )
}

function ErrorAlert({
  allowedDomainLabel,
  appName,
  errorCode,
}: {
  allowedDomainLabel: string
  appName: string
  errorCode: string
}) {
  if (errorCode === 'BANNED') {
    return (
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '0',
        }}
        role="alert"
      >
        <Ban
          size={16}
          style={{ color: 'var(--error)', flexShrink: 0, marginTop: '1px' }}
          aria-hidden="true"
        />
        <span
          style={{
            fontSize: '13px',
            color: 'var(--error)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Your account has been suspended.
        </span>
      </div>
    )
  }

  const message =
    errorCode === 'UNAUTHORIZED'
      ? `Your account is not authorized. ${appName} only allows ${allowedDomainLabel} Google accounts by default. Outside users must be invited by an admin.`
      : 'An authentication error occurred. Please try again.'

  return (
    <div
      style={{
        background: 'var(--yellow-dim)',
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0',
      }}
      role="alert"
    >
      <AlertCircle
        size={16}
        style={{ color: 'var(--yellow)', flexShrink: 0, marginTop: '1px' }}
        aria-hidden="true"
      />
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {message}
      </span>
    </div>
  )
}

function LoginCard({
  allowedDomainLabel,
  appName,
  teamMemberSingular,
  teamName,
}: LoginPageClientProps) {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error') ?? ''
  const shouldReduceMotion = useReducedMotion()
  const [loading, setLoading] = useState(false)
  const easeOut: Easing = 'easeOut'

  const makeVariants = (
    index: number
  ): Pick<HTMLMotionProps<'div'>, 'initial' | 'animate'> => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0, transition: { duration: 0 } },
      }
    }

    return {
      initial: { opacity: 0, y: 16 },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: easeOut,
          delay: index * 0.08,
        },
      },
    }
  }

  async function handleSignIn() {
    setLoading(true)
    try {
      await signIn('google')
    } catch {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        width: '100%',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        padding: '2.5rem',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 0 60px rgba(245, 197, 24, 0.06)',
      }}
    >
      <motion.div
        {...makeVariants(0)}
        style={{ textAlign: 'center', marginBottom: '0.5rem' }}
      >
        <span
          style={{
            fontSize: '64px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--yellow)',
            filter: 'drop-shadow(0 0 20px rgba(245, 197, 24, 0.4))',
            display: 'inline-block',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          π
        </span>
      </motion.div>

      <motion.div
        {...makeVariants(1)}
        style={{ textAlign: 'center', marginBottom: '0.25rem' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {appName}
        </span>
      </motion.div>

      <motion.div
        {...makeVariants(2)}
        style={{ textAlign: 'center', marginBottom: '0' }}
      >
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}
        >
          {teamName}
          <br />
          {teamMemberSingular} login is limited to {allowedDomainLabel} or invited outside
          collaborators.
        </div>
      </motion.div>

      {errorCode && (
        <motion.div {...makeVariants(3)} style={{ marginTop: '1.5rem' }}>
          <ErrorAlert
            allowedDomainLabel={allowedDomainLabel}
            appName={appName}
            errorCode={errorCode}
          />
        </motion.div>
      )}

      <motion.div {...makeVariants(errorCode ? 4 : 3)}>
        <div
          style={{
            height: '1px',
            background: 'var(--border-subtle)',
            margin: '1.5rem 0',
          }}
          aria-hidden="true"
        />
      </motion.div>

      <motion.div {...makeVariants(errorCode ? 5 : 4)}>
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-default)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.625rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 150ms',
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'var(--bg-active)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover)'
          }}
          aria-label="Continue with Google"
        >
          {loading ? (
            <div
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--yellow)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }}
              aria-hidden="true"
            />
          ) : (
            <GoogleGSvg />
          )}
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--text-primary)',
            }}
          >
            Continue with Google
          </span>
        </button>
      </motion.div>

      <motion.div
        {...makeVariants(errorCode ? 6 : 5)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.375rem',
          marginTop: '1.25rem',
        }}
      >
        <ShieldCheck
          size={16}
          style={{ color: 'var(--yellow)', flexShrink: 0 }}
          aria-hidden="true"
        />
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          Secured with Google Workspace. {allowedDomainLabel} by default, admin invite required
          otherwise.
        </span>
      </motion.div>
    </div>
  )
}

function DotGridBackground({ reduced }: { reduced: boolean | null }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage:
          'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        animation: reduced ? 'none' : 'dotPulse 4s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
  )
}

export function LoginPageClient(props: LoginPageClientProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <>
      <style>{`
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          minHeight: '100dvh',
          background: 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        <DotGridBackground reduced={shouldReduceMotion} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Suspense fallback={null}>
            <LoginCard {...props} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
