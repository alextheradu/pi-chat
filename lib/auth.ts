import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'aradu28@pascack.org'
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'pascack.org'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
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

      // Allow @pascack.org domain
      if (email.endsWith(`@${ALLOWED_DOMAIN}`)) {
        // Ensure user record exists and set approval
        await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: user.name ?? email.split('@')[0] ?? email,
            displayName: user.name ?? email.split('@')[0] ?? email,
            avatarUrl: user.image ?? null,
            role: email === ADMIN_EMAIL ? Role.ADMIN : Role.MEMBER,
            isApproved: true,
          },
        })
        // Enforce admin role for bootstrap admin
        if (email === ADMIN_EMAIL) {
          await prisma.user.update({
            where: { email },
            data: { role: Role.ADMIN, isApproved: true },
          })
        }
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
      return true
    },

    async jwt({ token, user }) {
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
