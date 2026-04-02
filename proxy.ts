import { auth } from '@/lib/auth'
import { projectConfig } from '@/lib/project-config'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = Boolean(session?.user)
  const isAuthRoute = nextUrl.pathname.startsWith('/login')
  const isNextAuthRoute = nextUrl.pathname.startsWith('/api/auth')
  const isHealthRoute = nextUrl.pathname === '/api/health'
  const isIncomingHookRoute = nextUrl.pathname.startsWith('/api/hooks/')
  const isPublicRoute = isAuthRoute || isNextAuthRoute || isHealthRoute || isIncomingHookRoute

  if (nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', projectConfig.appUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
