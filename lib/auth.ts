import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { projectConfig } from '@/lib/project-config'
import { Role } from '@prisma/client'

const ADMIN_EMAIL = projectConfig.adminEmail
const ALLOWED_DOMAIN = projectConfig.allowedDomain

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT strategy is required. Without it, PrismaAdapter defaults to database
  // sessions and the jwt/session callbacks are never invoked
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email
      if (!email) return false

      // Check if banned
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing?.isBanned) return '/login?error=BANNED'

      // Allow the configured primary sign-in domain
      if (email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        const isAdmin = email === ADMIN_EMAIL
        await prisma.user.upsert({
          where: { email },
          // On re-login: keep role/approval current (important for admin promotion)
          update: {
            role: isAdmin ? Role.ADMIN : undefined,
            isApproved: isAdmin ? true : undefined,
          },
          create: {
            email,
            name: user.name ?? email.split('@')[0] ?? email,
            displayName: user.name ?? email.split('@')[0] ?? email,
            avatarUrl: user.image ?? null,
            role: isAdmin ? Role.ADMIN : Role.MEMBER,
            isApproved: true,
          },
        })
        return true
      }

      // Check invite table for non-domain users
      const invite = await prisma.invite.findFirst({
        where: {
          email,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      })
      if (!invite) return '/login?error=UNAUTHORIZED'

      // Guest user from invite
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: user.name ?? email.split('@')[0] ?? email,
          displayName: user.name ?? email.split('@')[0] ?? email,
          avatarUrl: user.image ?? null,
          role: invite.role,
          isApproved: false, // admin must approve
        },
      })

      // Consume invite and mark it as used
      await prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      })

      return true
    },

    async jwt({ token, user }) {
      // On first sign-in, seed userId from the user object
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, isApproved: true, isBanned: true },
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.isApproved = dbUser.isApproved
          token.isBanned = dbUser.isBanned
        }
      } else if (token.userId) {
        // On every subsequent request, re-read role/ban state so changes
        // (ban, role promotion) take effect without requiring re-login
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as string },
          select: { role: true, isApproved: true, isBanned: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.isApproved = dbUser.isApproved
          token.isBanned = dbUser.isBanned
        }
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as Role
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})
