# Pi-Chat Phase 1: Scaffold, Database, Auth & Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the fully working Next.js 15 project with PostgreSQL, Prisma ORM, NextAuth v5 Google OAuth, and the Login page — everything needed before building UI.

**Architecture:** Next.js 15 App Router with `output: 'standalone'` for Docker. Prisma manages the schema and migrations. NextAuth v5 enforces `@pascack.org` domain restriction and auto-promotes `aradu28@pascack.org` to ADMIN. The Login page is the first visual touchpoint.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, Prisma 5, PostgreSQL 16 (Docker), NextAuth.js v5, Framer Motion, lucide-react, DM Sans + JetBrains Mono fonts

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | All dependencies locked |
| `next.config.ts` | standalone output, font vars |
| `tsconfig.json` | strict mode |
| `tailwind.config.ts` | v4 config |
| `app/globals.css` | CSS variables palette + font faces |
| `app/layout.tsx` | Root layout with fonts + PWA meta |
| `prisma/schema.prisma` | Full DB schema |
| `prisma/seed.ts` | Subdivisions, channels, admin user |
| `lib/auth.ts` | NextAuth v5 config |
| `lib/prisma.ts` | Prisma singleton |
| `lib/permissions.ts` | Role × permission matrix |
| `app/(auth)/login/page.tsx` | Login page |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth route handler |
| `app/api/health/route.ts` | Health check endpoint |
| `docker-compose.yml` | postgres + minio services only (app/nginx separate) |
| `.env.example` | All required env vars |

---

## Task 1: Initialize Next.js 15 Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`

- [ ] **Step 1: Initialize the project**

```bash
cd /srv/md0/robotics/pi-chat
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --no-import-alias \
  --yes
```

Expected: Next.js project created with App Router and Tailwind.

- [ ] **Step 2: Install all dependencies**

```bash
npm install \
  next-auth@beta \
  @auth/prisma-adapter \
  @prisma/client \
  prisma \
  socket.io-client \
  @tanstack/react-query \
  zustand \
  framer-motion \
  lucide-react \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/extension-mention \
  @tiptap/extension-link \
  @tiptap/extension-code-block-lowlight \
  lowlight \
  highlight.js \
  @dnd-kit/core \
  @dnd-kit/sortable \
  react-hook-form \
  @hookform/resolvers \
  zod \
  date-fns \
  minio \
  web-push \
  nodemailer \
  sharp \
  dompurify \
  @types/dompurify \
  idb \
  emoji-mart \
  @emoji-mart/react \
  @emoji-mart/data \
  marked

npm install -D \
  @types/web-push \
  @types/nodemailer \
  @types/node
```

- [ ] **Step 3: Configure `next.config.ts` with standalone output and fonts**

Replace the file contents with:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
}

export default nextConfig
```

- [ ] **Step 4: Configure strict TypeScript in `tsconfig.json`**

Ensure the `compilerOptions` block contains:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

- [ ] **Step 5: Commit scaffold**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 15 project with TypeScript strict, Tailwind v4"
```

---

## Task 2: Design System — CSS Variables & Fonts

**Files:**
- Create/Replace: `app/globals.css`

- [ ] **Step 1: Write `app/globals.css` with the full design system**

```css
@import "tailwindcss";

@layer base {
  :root {
    /* Base surfaces */
    --bg-base:     #0c0c0e;
    --bg-surface:  #111115;
    --bg-elevated: #18181f;
    --bg-hover:    #1e1e26;
    --bg-active:   #222230;

    /* Borders */
    --border-subtle:  #1a1a22;
    --border-default: #2a2a34;
    --border-strong:  #3a3a48;

    /* Text */
    --text-primary:   #f0f0f4;
    --text-secondary: #8b8b9a;
    --text-muted:     #52525e;
    --text-inverse:   #0c0c0e;

    /* Brand — Team 1676 Yellow */
    --yellow:        #f5c518;
    --yellow-hover:  #fcd73a;
    --yellow-dim:    rgba(245, 197, 24, 0.12);
    --yellow-border: rgba(245, 197, 24, 0.25);
    --yellow-glow:   rgba(245, 197, 24, 0.06);

    /* Semantic */
    --success:  #22c55e;
    --warning:  #f59e0b;
    --error:    #ef4444;

    /* Presence */
    --online:   #22c55e;
    --away:     #f59e0b;
    --dnd:      #ef4444;
    --offline:  #3a3a48;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    background-color: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-sans), system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 1ms !important;
      transition-duration: 1ms !important;
    }
  }
}
```

- [ ] **Step 2: Update root layout to load fonts**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Pi-Chat — Team 1676',
  description: 'FRC Team 1676 · The Pascack Pi-oneers communication hub',
  themeColor: '#f5c518',
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${dmSans.variable}`}
    >
      <body style={{ background: 'var(--bg-base)' }}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init --yes --base-color neutral --css-variables true
```

Install needed components:

```bash
npx shadcn@latest add button input label dialog popover dropdown-menu sheet tabs badge avatar skeleton toast command select checkbox switch
```

- [ ] **Step 4: Commit design system**

```bash
git add .
git commit -m "feat: add design system CSS variables, fonts, and shadcn/ui components"
```

---

## Task 3: Docker Compose for Dev Services

**Files:**
- Create: `docker-compose.dev.yml`
- Create: `.env.example`
- Create: `.env` (local, gitignored)

- [ ] **Step 1: Create `.env.example`**

```env
# ── Next.js ────────────────────────────────────────────────────
NEXTAUTH_URL=https://chat.team1676.com
NEXTAUTH_SECRET=                         # openssl rand -base64 32

# ── Google OAuth ───────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Database ───────────────────────────────────────────────────
DATABASE_URL=postgresql://pichat:PASSWORD@localhost:5432/pichat
POSTGRES_USER=pichat
POSTGRES_PASSWORD=

# ── MinIO ──────────────────────────────────────────────────────
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_FILES=pi-chat-files
MINIO_BUCKET_AVATARS=pi-chat-avatars

# ── Web Push ───────────────────────────────────────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@team1676.org
NEXT_PUBLIC_VAPID_PUBLIC_KEY=

# ── Socket.io ──────────────────────────────────────────────────
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001

# ── App config ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=aradu28@pascack.org
ALLOWED_DOMAIN=pascack.org
NODE_ENV=development
```

- [ ] **Step 2: Create `docker-compose.dev.yml`** (postgres + minio only, no nginx/app)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: pi-chat-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: pichat
      POSTGRES_USER: pichat
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pichat -d pichat"]
      interval: 5s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: pi-chat-minio-dev
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_dev_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_dev_data:
  minio_dev_data:
```

- [ ] **Step 3: Copy `.env.example` to `.env` and fill in dev values**

```bash
cp .env.example .env
# Set DATABASE_URL=postgresql://pichat:devpassword@localhost:5432/pichat
# Set MINIO_ACCESS_KEY=minioadmin
# Set MINIO_SECRET_KEY=minioadmin
# Set NEXTAUTH_SECRET=$(openssl rand -base64 32)
# Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Cloud Console
```

- [ ] **Step 4: Start dev services**

```bash
docker compose -f docker-compose.dev.yml up -d
```

Expected: postgres and minio containers start and pass healthchecks.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.dev.yml .env.example
git commit -m "feat: add docker-compose.dev.yml for postgres and minio dev services"
```

---

## Task 4: Prisma Schema & Migration

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String
  displayName   String?
  avatarUrl     String?
  googleId      String?     @unique
  role          Role        @default(MEMBER)
  status        UserStatus  @default(OFFLINE)
  statusMessage String?
  isApproved    Boolean     @default(false)
  isBanned      Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastSeenAt    DateTime?

  channelMemberships  ChannelMember[]
  messages            Message[]
  reactions           Reaction[]
  dmsSent             DirectMessage[]    @relation("DMSender")
  dmsReceived         DirectMessage[]    @relation("DMReceiver")
  groupDMMembers      GroupDMMember[]
  pushSubscriptions   PushSubscription[]
  auditLogs           AuditLog[]
  taskAssignments     Task[]             @relation("TaskAssignee")
  tasksCreated        Task[]             @relation("TaskCreator")
  pollVotes           PollVote[]
  pinnedMessages      PinnedMessage[]    @relation("PinnedBy")
  subdivisionMembers  SubdivisionMember[]
  invitesSent         Invite[]
}

enum Role {
  ADMIN
  MODERATOR
  SUBDIVISION_LEAD
  MEMBER
  GUEST
}

enum UserStatus {
  ONLINE
  AWAY
  DND
  OFFLINE
}

model Channel {
  id             String    @id @default(cuid())
  name           String    @unique
  slug           String    @unique
  description    String?
  isPrivate      Boolean   @default(false)
  isAnnouncement Boolean   @default(false)
  isArchived     Boolean   @default(false)
  subdivisionId  String?
  createdById    String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  members        ChannelMember[]
  messages       Message[]
  pinnedMessages PinnedMessage[]
  subdivision    Subdivision?    @relation(fields: [subdivisionId], references: [id])
}

model ChannelMember {
  id          String    @id @default(cuid())
  userId      String
  channelId   String
  joinedAt    DateTime  @default(now())
  lastReadAt  DateTime?
  isMuted     Boolean   @default(false)

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  channel     Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([userId, channelId])
}

model Message {
  id         String    @id @default(cuid())
  content    String
  authorId   String
  channelId  String
  threadId   String?
  isEdited   Boolean   @default(false)
  isDeleted  Boolean   @default(false)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  author      User           @relation(fields: [authorId], references: [id])
  channel     Channel        @relation(fields: [channelId], references: [id], onDelete: Cascade)
  attachments Attachment[]
  reactions   Reaction[]
  replies     Message[]      @relation("ThreadReplies")
  parent      Message?       @relation("ThreadReplies", fields: [threadId], references: [id])
  pinned      PinnedMessage?
  poll        Poll?
  linkPreviews LinkPreview[]
}

model Attachment {
  id        String   @id @default(cuid())
  messageId String
  fileName  String
  fileKey   String
  fileSize  Int
  mimeType  String
  createdAt DateTime @default(now())

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

model Reaction {
  id        String   @id @default(cuid())
  emoji     String
  messageId String
  userId    String
  createdAt DateTime @default(now())

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([emoji, messageId, userId])
}

model DirectMessage {
  id         String   @id @default(cuid())
  content    String
  senderId   String
  receiverId String
  isRead     Boolean  @default(false)
  isDeleted  Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender      User            @relation("DMSender", fields: [senderId], references: [id])
  receiver    User            @relation("DMReceiver", fields: [receiverId], references: [id])
  attachments DMAttachment[]
}

model DMAttachment {
  id        String        @id @default(cuid())
  dmId      String
  fileName  String
  fileKey   String
  fileSize  Int
  mimeType  String
  createdAt DateTime      @default(now())

  dm        DirectMessage @relation(fields: [dmId], references: [id], onDelete: Cascade)
}

model GroupDM {
  id        String   @id @default(cuid())
  name      String?
  createdAt DateTime @default(now())

  members   GroupDMMember[]
}

model GroupDMMember {
  id       String  @id @default(cuid())
  groupId  String
  userId   String

  group    GroupDM @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model PinnedMessage {
  id         String   @id @default(cuid())
  messageId  String   @unique
  channelId  String
  pinnedById String
  createdAt  DateTime @default(now())

  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  channel    Channel  @relation(fields: [channelId], references: [id], onDelete: Cascade)
  pinnedBy   User     @relation("PinnedBy", fields: [pinnedById], references: [id])
}

model LinkPreview {
  id          String   @id @default(cuid())
  messageId   String
  url         String
  title       String?
  description String?
  imageUrl    String?
  siteName    String?
  createdAt   DateTime @default(now())

  message     Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

model Poll {
  id          String    @id @default(cuid())
  messageId   String    @unique
  question    String
  isAnonymous Boolean   @default(false)
  endsAt      DateTime?
  createdAt   DateTime  @default(now())

  message     Message     @relation(fields: [messageId], references: [id], onDelete: Cascade)
  options     PollOption[]
  votes       PollVote[]
}

model PollOption {
  id     String @id @default(cuid())
  pollId String
  text   String
  order  Int

  poll   Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes  PollVote[]
}

model PollVote {
  id       String @id @default(cuid())
  pollId   String
  optionId String
  userId   String

  poll     Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  option   PollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)
  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([pollId, userId])
}

model Task {
  id            String       @id @default(cuid())
  title         String
  description   String?
  assigneeId    String?
  createdById   String
  subdivisionId String?
  status        TaskStatus   @default(TODO)
  priority      TaskPriority @default(MEDIUM)
  dueDate       DateTime?
  channelId     String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  assignee    User?        @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdBy   User         @relation("TaskCreator", fields: [createdById], references: [id])
  subdivision Subdivision? @relation(fields: [subdivisionId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Subdivision {
  id          String @id @default(cuid())
  name        String @unique
  displayName String
  color       String

  channels  Channel[]
  members   SubdivisionMember[]
  tasks     Task[]
}

model SubdivisionMember {
  id            String  @id @default(cuid())
  userId        String
  subdivisionId String
  isLead        Boolean @default(false)

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  subdivision   Subdivision @relation(fields: [subdivisionId], references: [id], onDelete: Cascade)

  @@unique([userId, subdivisionId])
}

model Invite {
  id          String    @id @default(cuid())
  email       String
  token       String    @unique @default(cuid())
  invitedById String
  role        Role      @default(GUEST)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  invitedBy   User      @relation(fields: [invitedById], references: [id])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String
  action     String
  targetType String?
  targetId   String?
  metadata   Json?
  createdAt  DateTime @default(now())

  actor      User     @relation(fields: [actorId], references: [id])
}
```

- [ ] **Step 2: Create `lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: Migration file created in `prisma/migrations/`, schema applied to postgres.

- [ ] **Step 4: Generate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/ lib/prisma.ts
git commit -m "feat: add full Prisma schema with all models and run initial migration"
```

---

## Task 5: Seed Database

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Create `prisma/seed.ts`**

```typescript
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

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
  const adminEmail = process.env.ADMIN_EMAIL ?? 'aradu28@pascack.org'
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

  // 3. Upsert channels
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
    const result = await prisma.channel.upsert({
      where: { slug: ch.slug },
      update: {},
      create: {
        ...channelFields,
        isPrivate: ch.isPrivate ?? false,
        isAnnouncement: ch.isAnnouncement ?? false,
        createdById: admin.id,
        subdivisionId: subdivisionName ? subdivisions[subdivisionName]?.id : null,
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

  // 5. Audit log entry
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'SYSTEM_INIT',
      metadata: { seededAt: new Date().toISOString() },
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Add seed script to `package.json`**

Add to the `"prisma"` section:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Install ts-node**

```bash
npm install -D ts-node
```

- [ ] **Step 4: Run seed**

```bash
npx prisma db seed
```

Expected: `Seed complete.` in output.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add database seed with subdivisions, channels, and bootstrap admin"
```

---

## Task 6: Permissions Library

**Files:**
- Create: `lib/permissions.ts`

- [ ] **Step 1: Create `lib/permissions.ts`**

```typescript
import { Role } from '@prisma/client'

const PERMISSIONS = {
  'message:send':                   ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST'],
  'message:send:announcement':      ['ADMIN', 'MODERATOR'],
  'message:delete:own':             ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'message:delete:any':             ['ADMIN', 'MODERATOR'],
  'message:edit:own':               ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'message:pin':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'],
  'channel:create':                 ['ADMIN', 'MODERATOR'],
  'channel:archive':                ['ADMIN', 'MODERATOR'],
  'channel:delete':                 ['ADMIN'],
  'channel:manage_members':         ['ADMIN', 'MODERATOR'],
  'member:ban':                     ['ADMIN', 'MODERATOR'],
  'member:change_role':             ['ADMIN'],
  'member:invite_guest':            ['ADMIN'],
  'admin:access':                   ['ADMIN'],
  'admin:view_moderator':           ['ADMIN', 'MODERATOR'],
  'admin:audit:read':               ['ADMIN', 'MODERATOR'],
  'admin:announcements:broadcast':  ['ADMIN', 'MODERATOR'],
  'task:create':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'task:assign:any':                ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD'],
  'task:assign:self':               ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'poll:create':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
  'dm:send':                        ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER', 'GUEST'],
  'file:upload':                    ['ADMIN', 'MODERATOR', 'SUBDIVISION_LEAD', 'MEMBER'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/permissions.ts
git commit -m "feat: add role/permission matrix"
```

---

## Task 7: NextAuth v5 Configuration

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'aradu28@pascack.org'
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN ?? 'pascack.org'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
            name: user.name ?? email.split('@')[0],
            displayName: user.name ?? email.split('@')[0],
            avatarUrl: user.image,
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
          name: user.name ?? email.split('@')[0],
          displayName: user.name ?? email.split('@')[0],
          avatarUrl: user.image,
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
```

- [ ] **Step 2: Extend NextAuth types in `types/next-auth.d.ts`**

```typescript
import { Role } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    role?: Role
    isApproved?: boolean
    isBanned?: boolean
  }
}
```

- [ ] **Step 3: Create `app/api/auth/[...nextauth]/route.ts`**

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 4: Add middleware for route protection**

Create `middleware.ts` at project root:

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isAuthRoute = nextUrl.pathname.startsWith('/login')
  const isApiRoute = nextUrl.pathname.startsWith('/api')
  const isPublicRoute = isAuthRoute || isApiRoute

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts app/api/auth/ types/ middleware.ts
git commit -m "feat: add NextAuth v5 with Google OAuth, domain restriction, and admin bootstrap"
```

---

## Task 8: Login Page

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/layout.tsx`

- [ ] **Step 1: Create `app/(auth)/layout.tsx`** (minimal, no sidebar)

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 2: Create `app/(auth)/login/page.tsx`**

> **Contribution request:** The Login page is the first impression for every team member. Please implement the `LoginCard` component in `app/(auth)/login/page.tsx`. The surrounding scaffold is ready — you need to fill in the visual card with the staggered Framer Motion entrance, the animated dot-grid background, the Google sign-in button with Magic UI shimmer, and the error alert states. See the spec section "LOGIN PAGE" for exact dimensions, animation timings, and design tokens.

The file should be created with this scaffold:

```typescript
'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, AlertCircle, Ban } from 'lucide-react'
import { Suspense } from 'react'

// TODO: Implement LoginCard with:
// 1. Full-viewport dark background with subtle animated dot-grid (CSS keyframes)
// 2. Centered card (max-w-[400px], var(--bg-surface), border-radius: 12px, padding 2.5rem)
// 3. Staggered Framer Motion entrance (each item: y:16->0, opacity 0->1, 80ms stagger)
//    Items: π glyph (64px, var(--font-mono), var(--yellow), radial glow pseudo-element)
//           "Pi-Chat" wordmark (var(--font-mono), 24px)
//           "FRC Team 1676 · The Pi-oneers" subtitle (13px, var(--text-muted))
//           horizontal rule (var(--border-subtle))
//           Google sign-in button (full-width, 44px height, Google G SVG, "Continue with Google")
//           footer text with ShieldCheck icon
// 4. Error states from ?error= param: UNAUTHORIZED and BANNED alerts
// 5. useReducedMotion() check — skip animations when requested

function LoginCard() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const shouldReduceMotion = useReducedMotion()

  // Implement here...
  return null
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  )
}
```

- [ ] **Step 3: Test login page renders at `http://localhost:3000/login`**

```bash
npm run dev
```

Navigate to `http://localhost:3000/login`. Expected: Login card visible with correct design tokens, no console errors.

- [ ] **Step 4: Test Google OAuth redirect**

Click "Continue with Google" — expected: redirect to Google consent screen.

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add login page with staggered animation and Google OAuth"
```

---

## Task 9: Health Check API

**Files:**
- Create: `app/api/health/route.ts`
- Create: `lib/minio.ts`

- [ ] **Step 1: Create `lib/minio.ts`**

```typescript
import * as Minio from 'minio'

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: parseInt(process.env.MINIO_PORT ?? '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
})

export const FILE_BUCKET = process.env.MINIO_BUCKET_FILES ?? 'pi-chat-files'
export const AVATAR_BUCKET = process.env.MINIO_BUCKET_AVATARS ?? 'pi-chat-avatars'

export async function ensureBuckets() {
  for (const bucket of [FILE_BUCKET, AVATAR_BUCKET]) {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) {
      await minioClient.makeBucket(bucket)
    }
  }
}
```

- [ ] **Step 2: Create `app/api/health/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { minioClient } from '@/lib/minio'

export async function GET() {
  const services: Record<string, 'ok' | 'error'> = { db: 'ok', minio: 'ok' }

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    services.db = 'error'
  }

  try {
    await minioClient.listBuckets()
  } catch {
    services.minio = 'error'
  }

  const status = Object.values(services).every(s => s === 'ok') ? 'ok' : 'degraded'

  return NextResponse.json({ status, services, timestamp: new Date().toISOString() })
}
```

- [ ] **Step 3: Test health endpoint**

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","services":{"db":"ok","minio":"ok"},...}`

- [ ] **Step 4: Commit**

```bash
git add lib/minio.ts app/api/health/
git commit -m "feat: add MinIO client and /api/health endpoint"
```

---

## Phase 1 Completion Checklist

- [ ] `npm run build` succeeds with zero TypeScript errors
- [ ] `http://localhost:3000/login` renders with correct dark theme and yellow accent
- [ ] Google OAuth redirects correctly
- [ ] `@pascack.org` user can sign in and is created in DB with `isApproved: true`
- [ ] `aradu28@pascack.org` gets `ADMIN` role on first sign in
- [ ] Non-`@pascack.org` email without invite is rejected to `/login?error=UNAUTHORIZED`
- [ ] `/api/health` returns `{"status":"ok",...}`
- [ ] All migrations applied cleanly
- [ ] Seed data present in DB (10 channels, 7 subdivisions, 1 admin)
