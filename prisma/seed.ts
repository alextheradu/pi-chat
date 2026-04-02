import { PrismaClient, Role } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Ensure .env is present and loaded.')
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Upsert subdivisions
  const subdivisionData = [
    { name: 'programming',  displayName: 'Programming',   color: '#6366f1' },
    { name: 'build',        displayName: 'Build',          color: '#f59e0b' },
    { name: 'drive',        displayName: 'Drive Team',     color: '#22c55e' },
    { name: 'electrical',   displayName: 'Electrical',     color: '#ef4444' },
    { name: 'design',       displayName: 'Design & CAD',   color: '#8b5cf6' },
    { name: 'business',     displayName: 'Business',       color: '#3b82f6' },
    { name: 'strategy',     displayName: 'Strategy',       color: '#f97316' },
  ]

  const subdivisions: Record<string, { id: string }> = {}
  for (const sub of subdivisionData) {
    const result = await prisma.subdivision.upsert({
      where: { name: sub.name },
      update: sub,
      create: sub,
    })
    subdivisions[sub.name] = result
  }

  // 2. Upsert bootstrap admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'john@example.com'
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, isApproved: true },
    create: {
      email: adminEmail,
      name: 'aradu28',
      displayName: 'aradu28',
      role: Role.ADMIN,
      isApproved: true,
    },
  })

  // 3. Upsert channels (update propagates spec changes on re-run)
  const channelData = [
    { name: 'announcements', slug: 'announcements', isAnnouncement: true,  description: 'Official team announcements. Read-only for members.' },
    { name: 'general',       slug: 'general',       description: 'General team discussion' },
    { name: 'programming',   slug: 'programming',   subdivisionName: 'programming', description: 'Java, WPILib, controls, autonomous' },
    { name: 'build',         slug: 'build',         subdivisionName: 'build',        description: 'Mechanical design & fabrication' },
    { name: 'drive-team',    slug: 'drive-team',    subdivisionName: 'drive',        description: 'Driver practice and strategy', isPrivate: true },
    { name: 'electrical',    slug: 'electrical',    subdivisionName: 'electrical',   description: 'Wiring, PDH, CAN, sensors' },
    { name: 'design-cad',    slug: 'design-cad',    subdivisionName: 'design',       description: 'CAD models and design reviews' },
    { name: 'business',      slug: 'business',      subdivisionName: 'business',     description: 'Outreach, sponsors, awards' },
    { name: 'strategy',      slug: 'strategy',      subdivisionName: 'strategy',     description: 'Match strategy and scouting' },
    { name: 'random',        slug: 'random',        description: 'Off-topic, memes, fun' },
  ]

  const channels: { id: string }[] = []
  for (const ch of channelData) {
    const { subdivisionName, ...channelFields } = ch as typeof ch & { subdivisionName?: string }
    const isPrivate = (ch as { isPrivate?: boolean }).isPrivate ?? false
    const isAnnouncement = (ch as { isAnnouncement?: boolean }).isAnnouncement ?? false
    const subdivisionId = subdivisionName ? subdivisions[subdivisionName]?.id ?? null : null
    const result = await prisma.channel.upsert({
      where: { slug: ch.slug },
      update: {
        ...channelFields,
        isPrivate,
        isAnnouncement,
        subdivisionId,
      },
      create: {
        ...channelFields,
        isPrivate,
        isAnnouncement,
        createdById: admin.id,
        subdivisionId,
      },
    })
    channels.push(result)
  }

  // 4. Add admin to all channels
  for (const channel of channels) {
    await prisma.channelMember.upsert({
      where: { userId_channelId: { userId: admin.id, channelId: channel.id } },
      update: {},
      create: { userId: admin.id, channelId: channel.id },
    })
  }

  // 5. Audit log entry (idempotent — only creates on first run)
  const alreadySeeded = await prisma.auditLog.findFirst({
    where: { action: 'SYSTEM_INIT' },
  })
  if (!alreadySeeded) {
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'SYSTEM_INIT',
        metadata: { seededAt: new Date().toISOString() },
      },
    })
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
