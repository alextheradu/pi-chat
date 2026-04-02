import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.')
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const subdivisionData = [
    { name: 'programming', displayName: 'Programming', color: '#6366f1' },
    { name: 'build', displayName: 'Build', color: '#f59e0b' },
    { name: 'drive', displayName: 'Drive Team', color: '#22c55e' },
    { name: 'electrical', displayName: 'Electrical', color: '#ef4444' },
    { name: 'design', displayName: 'Design & CAD', color: '#8b5cf6' },
    { name: 'business', displayName: 'Business', color: '#3b82f6' },
    { name: 'strategy', displayName: 'Strategy', color: '#f97316' },
  ]

  const subdivisions = {}
  for (const subdivision of subdivisionData) {
    const result = await prisma.subdivision.upsert({
      where: { name: subdivision.name },
      update: subdivision,
      create: subdivision,
    })
    subdivisions[subdivision.name] = result
  }

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

  const channelData = [
    {
      name: 'announcements',
      slug: 'announcements',
      isAnnouncement: true,
      description: 'Official team announcements. Read-only for members.',
    },
    { name: 'general', slug: 'general', description: 'General team discussion' },
    {
      name: 'programming',
      slug: 'programming',
      subdivisionName: 'programming',
      description: 'Java, WPILib, controls, autonomous',
    },
    {
      name: 'build',
      slug: 'build',
      subdivisionName: 'build',
      description: 'Mechanical design & fabrication',
    },
    {
      name: 'drive-team',
      slug: 'drive-team',
      subdivisionName: 'drive',
      description: 'Driver practice and strategy',
      isPrivate: true,
    },
    {
      name: 'electrical',
      slug: 'electrical',
      subdivisionName: 'electrical',
      description: 'Wiring, PDH, CAN, sensors',
    },
    {
      name: 'design-cad',
      slug: 'design-cad',
      subdivisionName: 'design',
      description: 'CAD models and design reviews',
    },
    {
      name: 'business',
      slug: 'business',
      subdivisionName: 'business',
      description: 'Outreach, sponsors, awards',
    },
    {
      name: 'strategy',
      slug: 'strategy',
      subdivisionName: 'strategy',
      description: 'Match strategy and scouting',
    },
    { name: 'random', slug: 'random', description: 'Off-topic, memes, fun' },
  ]

  const channels = []
  for (const channel of channelData) {
    const { subdivisionName, ...channelFields } = channel
    const result = await prisma.channel.upsert({
      where: { slug: channel.slug },
      update: {
        ...channelFields,
        isPrivate: channel.isPrivate ?? false,
        isAnnouncement: channel.isAnnouncement ?? false,
        subdivisionId: subdivisionName ? subdivisions[subdivisionName]?.id ?? null : null,
      },
      create: {
        ...channelFields,
        isPrivate: channel.isPrivate ?? false,
        isAnnouncement: channel.isAnnouncement ?? false,
        createdById: admin.id,
        subdivisionId: subdivisionName ? subdivisions[subdivisionName]?.id ?? null : null,
      },
    })
    channels.push(result)
  }

  for (const channel of channels) {
    await prisma.channelMember.upsert({
      where: { userId_channelId: { userId: admin.id, channelId: channel.id } },
      update: {},
      create: { userId: admin.id, channelId: channel.id },
    })
  }

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

  console.log('Production seed complete.')
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
