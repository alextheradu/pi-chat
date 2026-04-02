import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'example.com'

export async function POST(req: NextRequest) {
  const body = await req.json() as { idToken?: string }
  if (!body.idToken) {
    return NextResponse.json({ error: 'idToken required' }, { status: 400 })
  }

  let email: string, name: string, picture: string | undefined
  try {
    const ticket = await client.verifyIdToken({
      idToken: body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID!,
    })
    const payload = ticket.getPayload()!
    email   = payload.email!
    name    = payload.name ?? email.split('@')[0]!
    picture = payload.picture
  } catch {
    return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing?.isBanned) {
    return NextResponse.json({ error: 'BANNED' }, { status: 403 })
  }

  const hasInvite = await prisma.invite.findFirst({
    where: { email, usedAt: null, expiresAt: { gt: new Date() } },
  })
  const isAllowed = email.endsWith(`@${ALLOWED_DOMAIN}`) || hasInvite !== null
  if (!isAllowed) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 403 })
  }

  const isAdmin = email === ADMIN_EMAIL
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      avatarUrl: picture ?? undefined,
      ...(isAdmin ? { role: Role.ADMIN, isApproved: true } : {}),
    },
    create: {
      email,
      name,
      displayName: name,
      avatarUrl: picture ?? null,
      role: isAdmin ? Role.ADMIN : Role.MEMBER,
      isApproved: email.endsWith(`@${ALLOWED_DOMAIN}`),
    },
    select: { id: true, role: true, isApproved: true, isBanned: true },
  })

  // 30-day JWT for mobile convenience
  const token = await new SignJWT({ userId: user.id, role: user.role, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret)

  return NextResponse.json({
    token,
    user: { id: user.id, email, name, role: user.role, picture },
  })
}
