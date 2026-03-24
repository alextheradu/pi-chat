# Pi-Chat — Claude Code One-Shot Build Prompt
**FRC Team 1676 · Self-Hosted Slack Replacement · Production Grade**

---

You are building **Pi-Chat** — a complete, self-hosted Slack replacement for FRC Robotics Team 1676 (The Pascack Pi-oneers). This is a real production application that will be used daily by students and mentors. Build everything fully functional. No placeholder pages, no stub components, no `// TODO` comments. Every feature described below must work.

**Domains:** `chat.team1676.com` (production) · `chat.team1676.org` (development/staging)
**Bootstrap admin:** `aradu28@pascack.org` — automatically granted `ADMIN` role on first sign-in. Hardcode this in both the seed file and the NextAuth `signIn` callback.
**Allowed domain:** only `@pascack.org` emails may sign in by default. Invited guests are exceptions stored in the database.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, TypeScript strict mode, `output: 'standalone'` |
| UI Components | shadcn/ui (latest) |
| Icons | **lucide-react** — use Lucide for every icon in the app. Zero emoji in UI chrome. |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion (Motion library) + Magic UI components + ReactBits.dev where applicable |
| Database | PostgreSQL 16 (Docker container) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5, Google OAuth only |
| Real-time | Socket.io with a custom Node.js server running alongside Next.js |
| File Storage | MinIO (self-hosted S3-compatible, Docker) |
| Push Notifications | Web Push API with VAPID keys (`web-push` npm package) |
| PWA | `next-pwa` + Workbox + custom service worker |
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx (WebSocket-aware, SSL-ready) |
| Email | Nodemailer (or Resend as fallback) for invite emails |
| Rich Text | Tiptap editor for message composer |
| Drag and Drop | `@dnd-kit/core` for task kanban |
| State | Zustand for client state, TanStack Query for server state |
| Validation | Zod + React Hook Form |
| Syntax Highlighting | `lowlight` + `highlight.js` for code blocks |
| Date Utilities | `date-fns` |

---

## DESIGN SYSTEM

### Aesthetic
"Precision Dark" — dense, focused, fast. Think Linear.app and Vercel dashboard. The UI should feel like a precision engineering tool, not a consumer chat app. The team's brand colors are **yellow and black**. Yellow is the primary accent. Black and grays form the entire base. There is no blue, no indigo, no purple, no navy anywhere in the application — not in buttons, not in active states, not in badges, not in admin screens. Grays only. Yellow only for accent.

### Color Palette — define all of these as CSS variables in `globals.css`

```css
:root {
  /* Base surfaces — pure blacks and grays */
  --bg-base:     #0c0c0e;   /* outermost app background */
  --bg-surface:  #111115;   /* sidebar, panels */
  --bg-elevated: #18181f;   /* input areas, code blocks, cards */
  --bg-hover:    #1e1e26;   /* hover state */
  --bg-active:   #222230;   /* active/selected state */

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

  /* Semantic — all on dark backgrounds */
  --success:  #22c55e;
  --warning:  #f59e0b;
  --error:    #ef4444;

  /* Presence dots */
  --online:   #22c55e;
  --away:     #f59e0b;
  --dnd:      #ef4444;
  --offline:  #3a3a48;
}
```

### Typography

```ts
// next.config.ts — load fonts via next/font/google
import { JetBrains_Mono, DM_Sans } from 'next/font/google'

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
```

- `--font-mono` (`JetBrains Mono`) → all channel names, the wordmark/logo, badges, code, timestamps, keyboard shortcuts
- `--font-sans` (`DM Sans`) → all prose UI text, message content, labels

### Component Rules

- **Sidebar:** `var(--bg-surface)`, `1px` right border `var(--border-subtle)`
- **Active channel:** `3px` left solid bar in `var(--yellow)` + `var(--bg-active)` bg + `var(--yellow)` text
- **Buttons — primary:** `background: var(--yellow)`, `color: var(--text-inverse)`, `border-radius: 6px`, hover → `var(--yellow-hover)`
- **Buttons — ghost:** transparent bg, `1px` border `var(--border-default)`, hover → `var(--bg-hover)`
- **Active/focus rings:** `var(--yellow)` at 50% opacity — never blue
- **Message composer focus:** border color transitions to `var(--yellow)`
- **Unread badge:** `background: var(--yellow)`, `color: var(--text-inverse)`, `font-family: var(--font-mono)`
- **Admin role badge (ADMIN):** `background: var(--yellow)`, `color: var(--text-inverse)`, small pill
- **Modals:** `var(--bg-elevated)` background, `backdrop-blur-sm` overlay at `rgba(0,0,0,0.6)`
- **Border radius:** `6px` for inputs/buttons/items, `8px` for cards/modals
- **No shadows with color** — use `box-shadow: 0 0 0 1px var(--border-default)` for card outlines
- **@mention highlight:** `background: var(--yellow-dim)`, `color: var(--yellow)`, `border-radius: 3px`, `padding: 0 3px`
- **Thread reply chip:** `color: var(--yellow)`, icon from Lucide (`MessageSquare`)
- **Pinned bar:** `background: var(--yellow-glow)`, `border-bottom: 1px solid var(--yellow-border)`, Lucide `Pin` icon in `var(--yellow)`
- **Poll bars:** leading option `background: rgba(245,197,24,0.3)`, others `var(--bg-hover)`
- **Code blocks:** `background: var(--bg-elevated)`, `border: 1px solid var(--border-default)`, Lucide `Code2` icon as label
- **Skeleton loaders:** `var(--bg-elevated)` base, animated shimmer in `var(--bg-hover)` — no spinners anywhere

### Motion

```ts
// All transitions via Framer Motion
// Page load stagger: each item delays 40ms, y: 12 → 0, opacity: 0 → 1
// Message appear: y: 6 → 0, opacity: 0 → 1, duration: 180ms
// Sidebar item hover: background 80ms ease
// Modal open: scale 0.97 → 1.0, opacity 0 → 1, duration: 140ms
// Reaction add: scale 0.7 → 1.1 → 1.0, spring stiffness: 400
// Thread panel slide-in: x: 20 → 0, opacity 0 → 1, duration: 180ms
// Reduced motion: all animation durations set to 1ms when prefers-reduced-motion: reduce
```

---

## PROJECT STRUCTURE

```
pi-chat/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Login screen (Google OAuth)
│   ├── (app)/
│   │   ├── layout.tsx               # Main shell: sidebar + content area
│   │   ├── channel/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Channel message view
│   │   ├── dm/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Direct message view
│   │   ├── search/
│   │   │   └── page.tsx
│   │   └── tasks/
│   │       └── page.tsx             # Kanban task board
│   ├── admin/
│   │   ├── layout.tsx               # Admin shell (own sidebar)
│   │   ├── page.tsx                 # Admin overview / stats
│   │   ├── members/
│   │   │   └── page.tsx
│   │   ├── channels/
│   │   │   └── page.tsx
│   │   ├── roles/
│   │   │   └── page.tsx
│   │   ├── invites/
│   │   │   └── page.tsx
│   │   ├── audit/
│   │   │   └── page.tsx
│   │   └── broadcast/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── messages/
│   │   │   └── route.ts
│   │   ├── channels/
│   │   │   └── route.ts
│   │   ├── dm/
│   │   │   └── route.ts
│   │   ├── upload/
│   │   │   └── route.ts
│   │   ├── reactions/
│   │   │   └── route.ts
│   │   ├── polls/
│   │   │   └── route.ts
│   │   ├── tasks/
│   │   │   └── route.ts
│   │   ├── search/
│   │   │   └── route.ts
│   │   ├── push/
│   │   │   └── subscribe/
│   │   │       └── route.ts
│   │   ├── admin/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   └── layout.tsx                   # Root layout (fonts, PWA meta tags)
├── components/
│   ├── ui/                          # shadcn/ui primitives
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── SidebarChannelItem.tsx
│   │   ├── SidebarDMItem.tsx
│   │   ├── SidebarFooter.tsx
│   │   └── MobileNav.tsx
│   ├── messaging/
│   │   ├── MessageList.tsx
│   │   ├── MessageItem.tsx
│   │   ├── MessageComposer.tsx      # Tiptap rich text editor
│   │   ├── MessageThread.tsx        # Thread slide-in panel
│   │   ├── MessageReactions.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── PinnedBar.tsx
│   │   └── PollCard.tsx
│   ├── channels/
│   │   ├── ChannelHeader.tsx
│   │   ├── CreateChannelModal.tsx
│   │   └── ChannelSettingsModal.tsx
│   ├── admin/
│   │   ├── AdminSidebar.tsx
│   │   ├── MembersTable.tsx
│   │   ├── ChannelsTable.tsx
│   │   ├── RolesEditor.tsx
│   │   ├── AuditLogTable.tsx
│   │   ├── InvitesTable.tsx
│   │   └── BroadcastComposer.tsx
│   ├── pwa/
│   │   ├── InstallPrompt.tsx
│   │   └── PushSubscribeButton.tsx
│   └── shared/
│       ├── UserAvatar.tsx
│       ├── PresenceDot.tsx
│       ├── SearchModal.tsx
│       ├── SkeletonMessage.tsx
│       └── FilePreview.tsx
├── lib/
│   ├── auth.ts                      # NextAuth v5 config
│   ├── prisma.ts                    # Prisma singleton client
│   ├── socket-client.ts             # Socket.io client singleton
│   ├── minio.ts                     # MinIO client + helpers
│   ├── push.ts                      # VAPID push helpers
│   └── permissions.ts               # Role permission matrix + helpers
├── hooks/
│   ├── useSocket.ts
│   ├── useMessages.ts
│   ├── usePresence.ts
│   ├── useTyping.ts
│   ├── useUnread.ts
│   └── usePWA.ts
├── store/
│   └── app-store.ts                 # Zustand global state
├── server/
│   └── socket-server.ts             # Custom Socket.io + Express server
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/                       # All PWA icon sizes
├── nginx/
│   └── nginx.conf
├── docker/
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── next.config.ts
└── README.md
```

---

## DATABASE SCHEMA

Create this in `prisma/schema.prisma` exactly:

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

  sender     User              @relation("DMSender", fields: [senderId], references: [id])
  receiver   User              @relation("DMReceiver", fields: [receiverId], references: [id])
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
  id           String       @id @default(cuid())
  title        String
  description  String?
  assigneeId   String?
  createdById  String
  subdivisionId String?
  status       TaskStatus   @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime?
  channelId    String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

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

---

## AUTHENTICATION (`lib/auth.ts`)

```typescript
// NextAuth v5 configuration
// Rules:
// 1. Only allow Google OAuth
// 2. On signIn callback:
//    a. If email does not end with "@pascack.org", check the Invite table
//       for a matching email with usedAt = null and expiresAt > now()
//       If no invite found, return false (deny sign-in)
//    b. If email ends with "@pascack.org", allow automatically
// 3. On first sign-in, create the User record in DB:
//    - @pascack.org users: isApproved = true
//    - Invited guests: isApproved = false (admin must approve)
//    - If email === "aradu28@pascack.org": role = ADMIN, isApproved = true
// 4. On jwt callback: attach { userId, role, isApproved, isBanned } to token
// 5. On session callback: expose { userId, role } to client session
// 6. If isBanned === true: deny sign-in with error "BANNED"
// 7. Redirect unauthorized users to /login?error=UNAUTHORIZED
// 8. Redirect banned users to /login?error=BANNED
```

---

## LOGIN PAGE (`app/(auth)/login/page.tsx`)

This is the first impression. Make it visually striking.

**Layout:** Full viewport dark screen. Centered card (max-width 400px, `var(--bg-surface)` background, `1px` border `var(--border-default)`, `border-radius: 12px`, padding `2.5rem`).

**Background:** A subtle CSS grid pattern of dots or crossed lines using `var(--border-subtle)` at very low opacity (~0.4). The pattern should have a slight parallax or slow drift animation via CSS keyframes — just enough to feel alive, not distracting.

**Card contents (top to bottom, Framer Motion stagger each 80ms, y:16→0, opacity 0→1):**
1. The π symbol rendered large (~64px) in `var(--font-mono)` font, `color: var(--yellow)`, with a subtle radial glow behind it using `var(--yellow-glow)` — achieved via a pseudo-element, no JS
2. `Pi-Chat` wordmark in `var(--font-mono)`, 24px, `var(--text-primary)`
3. `FRC Team 1676 · The Pi-oneers` subtitle in 13px `var(--text-muted)`
4. A horizontal rule in `var(--border-subtle)`
5. The Google sign-in button: full-width, `var(--bg-elevated)` background, `1px` border `var(--border-default)`, `border-radius: 8px`, height `44px`. Left-aligned Google logo SVG (the official multicolor G) inlined, then text "Continue with Google" in 14px. Hover → `var(--bg-hover)`. Use Magic UI `BorderBeam` or `Shimmer` effect on this button.
6. Small footer text: `Only @pascack.org accounts may sign in` with a Lucide `ShieldCheck` icon, `var(--text-muted)`, 12px.

**Error states** (read from `?error=` query param):
- `UNAUTHORIZED`: show a red-bordered alert with Lucide `AlertCircle` + "This account is not authorized. Contact an admin to request access."
- `BANNED`: show a red-bordered alert with Lucide `Ban` + "This account has been suspended."

---

## MAIN APP LAYOUT (`app/(app)/layout.tsx`)

Three-column flex layout at desktop: `Sidebar (232px fixed) | Content (flex-1) | ThreadPanel (0px or 320px, animated)`

**Sidebar (`components/layout/Sidebar.tsx`):**

Top section:
- Team header: small yellow square logo block containing the π glyph (Lucide doesn't have Pi, render it as a styled span with `var(--font-mono)`), team name "Pi-oneers" in `var(--font-mono)`, "Team 1676" subtitle in 11px `var(--text-muted)`. Clicking opens a team settings popover.
- Search bar: `var(--bg-elevated)` background, `1px` border, `border-radius: 6px`, Lucide `Search` icon (14px, `var(--text-muted)`), placeholder "Search...", right-aligned `⌘K` badge. Clicking opens the `SearchModal`. Keyboard shortcut Cmd+K / Ctrl+K also opens it.

Channels section:
- Section label "CHANNELS" in 10px uppercase `var(--text-muted)` with `letter-spacing: 0.8px`. Right side: Lucide `Plus` (14px) in a 20px square ghost button — visible to ADMIN and MODERATOR only, opens `CreateChannelModal`.
- Channel items: Lucide `Hash` for public channels, Lucide `Lock` for private, Lucide `Megaphone` for announcement. Channel name in 13px `var(--font-sans)`. Unread count badge on right (yellow pill, monospace font).
- Subdivision channels are grouped under collapsible subdivision headers. The header is the subdivision display name in 10px uppercase, with Lucide `ChevronDown`/`ChevronRight` toggle. Each subdivision header has a small `3px` colored dot matching its color.
- Active channel: `3px` left border in `var(--yellow)`, `var(--bg-active)` bg, `var(--yellow)` text.

Direct Messages section:
- Section label "DIRECT MESSAGES" with Lucide `Plus` button on right.
- DM items: user avatar (28px circle, initials, color-seeded from userId), presence dot overlay (bottom-right, 7px, border `1px solid var(--bg-surface)`), display name, unread badge.

Bottom footer (fixed to sidebar bottom):
- Current user's avatar (32px), display name, presence status text ("Online", "Away", etc.).
- Icon row: Lucide `Bell` (notifications), Lucide `Settings` (user preferences), Lucide `ShieldCheck` (admin — visible to ADMIN/MODERATOR only, links to `/admin`).

**Channel Header (`components/channels/ChannelHeader.tsx`):**
- Height: 48px, `border-bottom: 1px solid var(--border-subtle)`
- Left: channel type icon + channel name in `var(--font-mono)` 14px medium
- Center: description in 12px `var(--text-muted)`, truncated, separated by a `1px` vertical divider
- Right icon group: Lucide `Pin` (opens pinned messages panel), Lucide `Search` (search within channel), Lucide `Users` (member list popover), Lucide `Settings` (ADMIN/MODERATOR only)

**Pinned Bar:**
- Appears below channel header when pinned messages exist
- `var(--yellow-glow)` background, `1px` bottom border `var(--yellow-border)`
- Lucide `Pin` icon (12px) in `var(--yellow)`, then truncated preview text of the most recently pinned message
- Clicking opens a `PinnedMessagesDrawer` from the right

---

## MESSAGING

### Message List (`components/messaging/MessageList.tsx`)
- Virtualized scroll using `react-virtual` or manual windowing
- Reverse chronological — newest at bottom
- Load earlier messages on scroll to top (infinite scroll upward, TanStack Query with cursor pagination)
- Date dividers: horizontal rule with centered date chip in `var(--bg-elevated)`, 11px `var(--font-mono)` `var(--text-muted)` text
- Message groups: consecutive messages from same author within 5 minutes are grouped (no repeated avatar/name, only timestamp on hover)
- `@mention` highlight: `var(--yellow-dim)` left border + `var(--yellow-glow)` background on the entire message row
- `role="log"` on the container, `aria-live="polite"` for new messages

### Message Item (`components/messaging/MessageItem.tsx`)
Each message row:
- Left: user avatar (32px circle) or indent spacer for grouped messages
- Right block:
  - Header row: display name (13px medium `var(--text-primary)`), role badge if ADMIN/MODERATOR/SUBDIVISION_LEAD, timestamp (10px `var(--font-mono)` `var(--text-muted)`, shown on group hover)
  - Content: rendered markdown. Use `@tiptap/extension-*` or `marked` for rendering. Support: **bold**, *italic*, `inline code`, code blocks (with `lowlight` syntax highlighting, language label, Lucide `Copy` button), > blockquotes, ~~strikethrough~~, [links](url)
  - `@username` mentions → yellow highlight spans
  - Attachments: images render inline (max-width 400px, max-height 300px, click opens lightbox). Other files show a file card: Lucide file type icon, filename, size, Lucide `Download` button
  - Link previews: card below message, `var(--bg-elevated)` bg, OG image thumbnail, title, description, site name
  - Poll card: see Poll section below
  - Reactions row: below content if reactions exist
  - Thread reply chip: Lucide `MessageSquare` icon + "N replies · Last reply X" in `var(--yellow)`

**Hover action bar** (appears on message hover, positioned absolute top-right of the message group):
- Background: `var(--bg-elevated)`, `1px` border `var(--border-default)`, `border-radius: 8px`, padding `2px 4px`
- Buttons (24px square each, icon 14px): Lucide `Smile` (add reaction), Lucide `Reply` (reply in thread), Lucide `Pin` (ADMIN/MOD/LEAD only), Lucide `Pencil` (own messages), Lucide `Trash2` (own messages or ADMIN/MOD), Lucide `MoreHorizontal` (overflow menu)

### Message Composer (`components/messaging/MessageComposer.tsx`)
- Tiptap editor with extensions: Bold, Italic, Strike, Code, CodeBlock, Link, HardBreak, History, Mention
- Container: `var(--bg-elevated)`, `1px` border `var(--border-default)`, `border-radius: 8px`
- Focus: border color → `var(--yellow)`
- Toolbar row (above text area, separated by `1px` border): icon buttons for Bold (`B`, Lucide `Bold`), Italic (Lucide `Italic`), Code (Lucide `Code`), CodeBlock (Lucide `FileCode`), Link (Lucide `Link`), divider, Lucide `AtSign` (@mention), Lucide `Smile` (emoji picker), Lucide `Paperclip` (file upload), divider, `/poll` command hint
- Text area: min-height `44px`, max-height `200px`, auto-expands. Placeholder: "Message #channel-name..."
- Bottom row: file drop hint (Lucide `Upload` icon, "Drag files here"), right side: Lucide `Send` button in a `var(--yellow)` `28px` square button
- `Enter` to send, `Shift+Enter` for newline, `Escape` to cancel edit
- `@mention` autocomplete: dropdown anchored to cursor, shows avatar + name, keyboard navigable
- Slash command `/poll [question] | [opt1] | [opt2] | [opt3]` creates a poll
- Drag-and-drop files onto composer area → upload
- Paste image from clipboard → upload

### Typing Indicator (`components/messaging/TypingIndicator.tsx`)
- 24px tall row below message list
- Three dots animation: each dot is `5px` circle in `var(--text-muted)`, animation: `translateY(0 → -4px → 0)` with 200ms stagger
- Text: "{name} is typing..." or "{name1} and {name2} are typing..." or "Several people are typing..."
- Emits `typing:start` on keydown, `typing:stop` after 3s idle or on send

### Reactions (`components/messaging/MessageReactions.tsx`)
- Pill shape: `border-radius: 10px`, `var(--bg-elevated)` bg, `1px` border `var(--border-default)`
- Yours: `var(--yellow-dim)` bg, `var(--yellow-border)` border
- Hover: `var(--bg-hover)` bg
- Click to toggle your reaction
- Click Lucide `Smile` hover button → emoji picker (use `emoji-mart` package, dark theme)

### Poll Card (`components/messaging/PollCard.tsx`)
- `var(--bg-elevated)` background, `1px` border `var(--border-default)`, `border-radius: 8px`, padding `12px 14px`
- Lucide `BarChart2` icon + question text
- Each option: option text left, vote count right, full-width progress bar below
- Leading option: `rgba(245,197,24,0.3)` bar fill; others: `var(--bg-hover)` fill
- Your voted option: `var(--yellow-border)` border on the option row
- Vote count + percentage in `var(--font-mono)` 11px
- Total votes + time remaining below options
- Anonymous polls: hide individual voter names
- Real-time vote updates via Socket.io `poll:vote` event

---

## REAL-TIME (Socket.io)

### Custom Server (`server/socket-server.ts`)
Create a standalone Express + Socket.io server. Next.js and the socket server run as two separate processes in Docker. The socket server listens on port `3001`. Nginx proxies `/socket.io/` to port `3001` with WebSocket upgrade headers.

**Authentication middleware:** On socket connection handshake, extract the NextAuth session token from the `cookie` header (use `next-auth/jwt` `getToken()`). Reject connections that have no valid session. Attach `{ userId, role }` to `socket.data`.

**Rooms:** On authenticated connection, auto-join:
- All channels the user is a member of: `channel:{channelId}`
- The user's personal room: `user:{userId}`

**Server → Client events:**
```typescript
'message:new'         // { message: MessageWithAuthor }
'message:edit'        // { messageId, content, editedAt }
'message:delete'      // { messageId }
'reaction:add'        // { messageId, emoji, userId, count }
'reaction:remove'     // { messageId, emoji, userId, count }
'thread:reply'        // { parentId, reply: MessageWithAuthor }
'dm:new'              // { dm: DirectMessageWithSender }
'typing:start'        // { userId, channelId, userName }
'typing:stop'         // { userId, channelId }
'presence:update'     // { userId, status: UserStatus }
'channel:created'     // { channel: Channel }
'channel:archived'    // { channelId }
'member:joined'       // { channelId, user: User }
'poll:vote'           // { pollId, options: PollOptionWithCounts[] }
'announcement:broadcast' // { content, authorId }
'unread:update'       // { channelId, count }
```

**Client → Server events:**
```typescript
'message:send'        // { channelId, content, attachments? }
'message:edit'        // { messageId, content }
'message:delete'      // { messageId }
'reaction:toggle'     // { messageId, emoji }
'typing:start'        // { channelId }
'typing:stop'         // { channelId }
'channel:join'        // { channelId }
'dm:send'             // { receiverId, content }
'poll:vote'           // { pollId, optionId }
'presence:update'     // { status: UserStatus }
```

**Socket.io fallback:** If the WebSocket connection fails, fall back to polling every 5 seconds using standard fetch against the REST API. Reconnect and restore socket when connection is re-established. Show a yellow Lucide `WifiOff` banner when disconnected.

---

## SEARCH

**Global Search Modal (`components/shared/SearchModal.tsx`):**
- Opens with Cmd+K / Ctrl+K or clicking the search bar
- Full-screen overlay with centered input (max-width 560px)
- Lucide `Search` icon left of input, Lucide `X` button right, `Escape` to close
- Debounced search (300ms) against `GET /api/search?q={query}&type={all|messages|channels|people}`
- Results grouped by type with section headers
- Message results: show author avatar, channel name, message snippet with matched text highlighted, relative timestamp
- Click a message result → navigate to that channel, scroll to that message (fetch context, highlight with `var(--yellow-dim)` background that fades over 1s)
- Channel results: show Lucide `Hash` or `Lock`, channel name, description
- People results: show avatar, display name, role badge, subdivision
- No results state: Lucide `SearchX` icon + "No results for '{query}'"

---

## DIRECT MESSAGES

`/dm/[id]` page works identically to channel messages but for 1-on-1 and group DMs:
- No channel header — show the other user's name/avatar + presence status, or group member list
- Same `MessageComposer`, same `MessageList`, same reactions and threads
- New DM flow: clicking Lucide `Plus` next to "Direct Messages" opens a user search modal to start a new conversation
- Group DMs: up to 9 members, named or unnamed
- DMs are real-time via `dm:{conversationId}` socket room

---

## ADMIN DASHBOARD

Route group `/admin/*` — server-side check: if `session.user.role !== 'ADMIN' && role !== 'MODERATOR'`, redirect to `/`. The admin layout has its own sidebar separate from the chat layout.

**Admin Sidebar (`components/admin/AdminSidebar.tsx`):**
Navigation items with Lucide icons:
- Lucide `LayoutDashboard` — Overview
- Lucide `Users` — Members
- Lucide `Hash` — Channels
- Lucide `Shield` — Roles
- Lucide `Mail` — Invites
- Lucide `ScrollText` — Audit Log
- Lucide `Megaphone` — Broadcast
- Bottom: Lucide `ArrowLeft` — Back to Pi-Chat

**`/admin` — Overview:**
Stat cards (2×2 grid on desktop): Total members, Active today, Total channels, Messages today, Storage used (MinIO API), Pending approvals (with yellow badge if > 0).
Below: Recent audit log entries (last 10), Recent signups.

**`/admin/members`:**
Full TanStack Table with:
- Columns: Avatar+Name, Email, Role (badge), Subdivision, Status (presence dot + text), Joined, Last Seen, Actions
- Role badge colors: ADMIN → yellow, MODERATOR → gray with border, SUBDIVISION_LEAD → lighter gray, MEMBER → muted, GUEST → dashed border
- Row actions (Lucide icons in a dropdown): Change Role, Assign Subdivision, Ban/Unban (Lucide `Ban`), Remove, View Profile
- Filter toolbar: role dropdown, subdivision dropdown, search by name/email
- Bulk actions: select rows → "Change Role" or "Ban Selected" appears
- Top section: "Pending Approvals" card — shows guests awaiting approval with Lucide `Check` and Lucide `X` per row
- Banning triggers: update `isBanned = true`, emit socket `user:banned` to kick active sessions

**`/admin/channels`:**
Table: name, type (icon + label), subdivision, member count, message count, created date, archived status.
Row actions: Edit (Lucide `Pencil` — opens modal), Archive/Unarchive (Lucide `Archive`), Delete (Lucide `Trash2` — requires typed confirmation).
"+ Create Channel" button (yellow, top right) opens `CreateChannelModal`.
`CreateChannelModal` fields: Name (auto-slug), Description, Private toggle, Announcement toggle, Subdivision assignment, Initial members search.

**`/admin/roles`:**
Visual table of roles × permissions. Rows = roles, columns = permission keys. Checkmarks (Lucide `Check`) per cell, togglable for MODERATOR and below (ADMIN permissions are locked). Save button commits changes. Permission keys:
```
message:send, message:send:announcement, message:delete:own,
message:delete:any, message:pin, channel:create, channel:archive,
channel:delete, channel:manage_members, member:ban, member:change_role,
member:invite_guest, admin:access, admin:audit:read,
admin:announcements, task:create, task:assign:any, poll:create
```

**`/admin/invites`:**
Table: email, role, invited by, expires, status (pending/used/expired).
"+ Invite Someone" button → modal: email input, role selector (MEMBER/GUEST), expiry (24h/7d/30d/never), optional "Send email" toggle.
Generates a unique token; if email toggle is on, sends an invite email via Nodemailer with a sign-in link.
Revoke button (Lucide `X`) on pending invites.

**`/admin/audit`:**
Reverse-chronological log. Each row: actor avatar + name, action type badge (color-coded gray variants: destructive actions darker, config changes lighter), target (linked if applicable), timestamp (relative + absolute on hover), expandable metadata drawer showing raw JSON.
Filter: by actor (search), by action type (multi-select), by date range (date picker).
"Export CSV" button (Lucide `Download`).

**`/admin/broadcast`:**
Tiptap composer (same as message composer but full-width).
Target selector: All Members / Specific Subdivision / Specific Role.
Preview button shows how it'll look in chat.
Send button → posts as a system message to `#announcements` AND triggers push notifications to all targeted users.
Broadcast history table below the composer.

---

## TASKS (`app/(app)/tasks/page.tsx`)

Kanban board with four columns: TODO · IN PROGRESS · BLOCKED · DONE.
Built with `@dnd-kit/core` — drag cards between columns.

**Task card:** Title, description snippet, assignee avatar (or Lucide `UserPlus` if unassigned), subdivision color dot, priority badge (Lucide `AlertTriangle` for URGENT, `ArrowUp` for HIGH, `Minus` for MEDIUM, `ArrowDown` for LOW), due date with Lucide `Calendar` icon (red if overdue).

**Create task:** Lucide `Plus` button in each column header → inline form or modal. Fields: Title (required), Description, Assign to (user search), Subdivision, Priority, Due date, Linked channel.

**Filters (top bar):** All / My Tasks / By Subdivision / By Assignee. Priority filter. Due date filter.

**Permissions:** ADMIN, MODERATOR, SUBDIVISION_LEAD can assign to anyone. MEMBER can only assign to themselves. GUEST cannot create tasks.

---

## PWA & MOBILE

### Manifest (`public/manifest.json`)
```json
{
  "name": "Pi-Chat — Team 1676",
  "short_name": "Pi-Chat",
  "description": "FRC Team 1676 · The Pascack Pi-oneers communication hub",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0c0c0e",
  "theme_color": "#f5c518",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-72.png",  "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96.png",  "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```
Generate all icon sizes programmatically from a source SVG using `sharp`. The icon is the π symbol in `var(--yellow)` on a `#0c0c0e` background.

### Add to Home Screen Prompt (`components/pwa/InstallPrompt.tsx`)
- Listen for `beforeinstallprompt` event
- Show a dismissible banner at the top of the app (below the channel header) on first visit
- Banner: Lucide `Smartphone` icon + "Add Pi-Chat to your home screen" + "Install" button (yellow) + Lucide `X` dismiss
- Store dismissed state in `localStorage`
- On iOS (where `beforeinstallprompt` doesn't fire): detect via `navigator.standalone === false && /iPhone|iPad/.test(navigator.userAgent)` and show manual instructions modal with Safari share icon steps

### Push Notifications (`lib/push.ts`)
- `POST /api/push/subscribe` — save `PushSubscription` record to DB
- Trigger push notifications on:
  - New DM received
  - `@mention` in any channel
  - New message in a channel where the user has push enabled
  - Admin broadcast
- Notification payload: `{ title, body, icon: '/icons/icon-192.png', badge: '/icons/icon-72.png', data: { url: '/channel/{id}' } }`
- Click on notification → opens Pi-Chat to the relevant channel/DM

### Service Worker (`public/sw.js`)
Use `next-pwa` to generate via Workbox. Configure:
- Precache: app shell, fonts, icons, critical JS/CSS
- Runtime cache: images (stale-while-revalidate), API responses (network-first)
- Handle `push` events — show notification via `self.registration.showNotification()`
- Handle `notificationclick` — `clients.openWindow(event.notification.data.url)`
- Handle `sync` event (Background Sync) for queued messages

### Offline Message Queue
- When `navigator.onLine === false`, intercept sends and store in IndexedDB using `idb` package
- Show Lucide `WifiOff` banner: "You're offline. Messages will send when you reconnect."
- When connection restores, flush queued messages in order via Background Sync API
- Queued messages show in UI with a Lucide `Clock` indicator

### Mobile Layout
- Sidebar hidden below 768px, opens as a bottom sheet / slide-in drawer via Lucide `Menu` hamburger in the header
- Thread panel is full-screen overlay on mobile
- Bottom navigation bar (mobile only, `48px`, `var(--bg-surface)`, `1px` top border): Lucide `Home`, Lucide `MessageSquare` (DMs), Lucide `CheckSquare` (Tasks), Lucide `User` (Profile) — 4 equal columns
- All touch targets minimum `44px`
- Use `env(safe-area-inset-bottom)` on the bottom nav and message composer
- Swipe right on a message item → shows thread action

---

## FILE UPLOADS (MinIO)

**Bucket setup:** On application startup, check if `pi-chat-files` bucket exists; create it with private policy if not. Use a startup script that runs before Next.js (`scripts/init-minio.ts`).

**Upload flow:**
1. Client selects or drops file into the composer
2. `POST /api/upload` — multipart form upload, streamed directly to MinIO
3. Returns `{ fileKey, fileName, fileSize, mimeType }`
4. Composer stores the attachment metadata; it's sent with the message payload

**File access:** Never expose MinIO URLs directly. Generate presigned URLs with 60-minute expiry in the API route that returns messages. Regenerate on fetch.

**File type handling:**
- Images: inline preview, click → lightbox with Lucide `ZoomIn`, `Download`, `X`
- PDF: Lucide `FileText` icon, filename, size, Lucide `ExternalLink` to open in new tab via presigned URL
- Code files (`.java`, `.py`, `.ts`, etc.): Lucide `FileCode` icon, syntax-highlighted preview if < 50KB
- CAD files (`.step`, `.stp`, `.f3d`, `.stl`): Lucide `Box` icon, filename, size, Lucide `Download`
- Other: Lucide `File` icon, filename, size, Lucide `Download`

**Avatars:** Separate bucket `pi-chat-avatars`. Users can upload via profile settings. Resize to 256×256 using `sharp` on upload.

---

## PERMISSIONS (`lib/permissions.ts`)

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

---

## DOCKER COMPOSE (`docker-compose.yml`)

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: pi-chat-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy
    command: >
      sh -c "npx prisma migrate deploy &&
             node scripts/init-minio.js &&
             node server.js"

  socket:
    build:
      context: .
      dockerfile: docker/Dockerfile
    container_name: pi-chat-socket
    restart: unless-stopped
    ports:
      - "3001:3001"
    env_file: .env
    environment:
      - RUN_MODE=socket
    depends_on:
      postgres:
        condition: service_healthy
    command: node server/socket-server.js

  postgres:
    image: postgres:16-alpine
    container_name: pi-chat-postgres
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_DB: pichat
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d pichat"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: pi-chat-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    env_file: .env
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: pi-chat-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - app
      - socket

volumes:
  postgres_data:
  minio_data:
```

### Dockerfile (`docker/Dockerfile`)
Multi-stage build:
1. **`deps`** — `node:20-alpine`, install all deps with `npm ci`
2. **`builder`** — copy source, run `next build` with `NEXT_TELEMETRY_DISABLED=1`
3. **`runner`** — `node:20-alpine`, copy only `standalone/` output, static files, and public dir. Set `NODE_ENV=production`. Expose port 3000. `CMD ["node", "server.js"]`

### Nginx (`nginx/nginx.conf`)
- Two server blocks: `chat.team1676.com` and `chat.team1676.org`
- SSL termination (certs at `/etc/nginx/certs/`, Certbot-ready with Let's Encrypt paths)
- Proxy all traffic to `app:3000`
- Proxy `/socket.io/` to `socket:3001` with headers: `Upgrade $http_upgrade`, `Connection "upgrade"`, `Host $host`, `X-Real-IP $remote_addr`
- `gzip on` for text, JS, CSS
- Static file cache headers: `Cache-Control: public, max-age=31536000, immutable` for `/_next/static/`
- HTTP → HTTPS redirect on port 80
- `client_max_body_size 50m` for file uploads

---

## SEED DATA (`prisma/seed.ts`)

```typescript
// 1. Upsert subdivisions
const subdivisions = [
  { name: 'programming',  displayName: 'Programming',   color: '#6366f1' },
  { name: 'build',        displayName: 'Build',          color: '#f59e0b' },
  { name: 'drive',        displayName: 'Drive Team',     color: '#22c55e' },
  { name: 'electrical',   displayName: 'Electrical',     color: '#ef4444' },
  { name: 'design',       displayName: 'Design & CAD',   color: '#8b5cf6' },
  { name: 'business',     displayName: 'Business',       color: '#3b82f6' },
  { name: 'strategy',     displayName: 'Strategy',       color: '#f97316' },
]

// 2. Upsert channels
const channels = [
  { name: 'announcements', isAnnouncement: true,  description: 'Official team announcements. Read-only for members.' },
  { name: 'general',       isAnnouncement: false, description: 'General team discussion' },
  { name: 'programming',   subdivisionName: 'programming', description: 'Java, WPILib, controls, autonomous' },
  { name: 'build',         subdivisionName: 'build',        description: 'Mechanical design & fabrication' },
  { name: 'drive-team',    subdivisionName: 'drive',        description: 'Driver practice and strategy', isPrivate: true },
  { name: 'electrical',    subdivisionName: 'electrical',   description: 'Wiring, PDH, CAN, sensors' },
  { name: 'design-cad',    subdivisionName: 'design',       description: 'CAD models and design reviews' },
  { name: 'business',      subdivisionName: 'business',     description: 'Outreach, sponsors, awards' },
  { name: 'strategy',      subdivisionName: 'strategy',     description: 'Match strategy and scouting' },
  { name: 'random',        description: 'Off-topic, memes, fun' },
]

// 3. Upsert bootstrap admin
// prisma.user.upsert where email = "aradu28@pascack.org"
// create: { email, name: 'aradu28', role: 'ADMIN', isApproved: true }
// update: { role: 'ADMIN', isApproved: true }

// 4. Add admin to all channels

// 5. Insert AuditLog: { actorId: adminUserId, action: 'SYSTEM_INIT', metadata: { seededAt: new Date() } }
```

---

## ENVIRONMENT VARIABLES (`.env.example`)

```env
# ── Next.js ────────────────────────────────────────────────────
NEXTAUTH_URL=https://chat.team1676.com
NEXTAUTH_SECRET=                         # openssl rand -base64 32

# ── Google OAuth ───────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ── Database ───────────────────────────────────────────────────
DATABASE_URL=postgresql://pichat:PASSWORD@postgres:5432/pichat
POSTGRES_USER=pichat
POSTGRES_PASSWORD=

# ── MinIO ──────────────────────────────────────────────────────
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_FILES=pi-chat-files
MINIO_BUCKET_AVATARS=pi-chat-avatars

# ── Web Push ───────────────────────────────────────────────────
VAPID_PUBLIC_KEY=                        # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@team1676.org
NEXT_PUBLIC_VAPID_PUBLIC_KEY=            # same value as VAPID_PUBLIC_KEY

# ── Socket.io ──────────────────────────────────────────────────
NEXT_PUBLIC_SOCKET_URL=https://chat.team1676.com
SOCKET_PORT=3001

# ── App config ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://chat.team1676.com
ADMIN_EMAIL=aradu28@pascack.org
ALLOWED_DOMAIN=pascack.org
NODE_ENV=production
```

---

## API HEALTH CHECK

```typescript
// GET /api/health
// Returns: { status: 'ok' | 'degraded', services: { db: 'ok'|'error', minio: 'ok'|'error' }, timestamp: string }
// Used by Docker healthcheck and external uptime monitoring
// No auth required
```

---

## QUALITY REQUIREMENTS

Every one of these applies to the final build:

- **TypeScript strict mode** throughout — zero `any`, zero `ts-ignore`
- **No emojis in UI chrome** — every icon is from `lucide-react`. Emojis are only allowed inside user-generated message content and in the emoji picker.
- **No blue/indigo/purple/navy anywhere** — the only accent color is `var(--yellow)`. All interactive state, focus rings, active indicators, badges, and highlights use yellow or neutral grays.
- **Optimistic UI** — messages appear instantly in the UI with a subtle opacity dim, confirmed on server ACK, rolled back with a toast on failure
- **Skeleton loaders** for all async content — message list, sidebar, admin tables, user search. No spinners.
- **Error boundaries** around sidebar, message list, thread panel, each admin section
- **Rate limiting** — 30 messages/minute per user on message endpoints. Respond with 429 + `Retry-After` header.
- **Input sanitization** — sanitize all message HTML before rendering with `DOMPurify`
- **Accessibility** — `role="log"` on message lists, `aria-live="polite"` for new messages, `aria-label` on all icon-only buttons, full keyboard nav (Tab, Enter, Escape, Arrow keys in menus), focus trap in modals, skip-to-content link
- **`prefers-reduced-motion`** — all Framer Motion animations must use a `useReducedMotion()` check and reduce to instant/no animation when set
- **Mobile** — sidebar collapses to a drawer on < 768px, bottom nav appears, message composer stays thumb-accessible, admin tables become stacked cards on mobile

---

## IMPLEMENTATION ORDER

Build in this exact sequence to avoid dependency issues:

1. Initialize Next.js 15 project: TypeScript strict, Tailwind v4, App Router, `output: 'standalone'`
2. Install all dependencies from the stack table above
3. Configure `globals.css` with the complete CSS variable palette and font imports
4. Configure shadcn/ui (init, install all needed components)
5. Write the full Prisma schema and run initial migration
6. Configure NextAuth v5 with Google provider, domain restriction, admin bootstrap
7. Write `lib/permissions.ts`
8. Build the Login page (full visual spec above)
9. Stand up Docker Compose — verify postgres + minio + app all start
10. Seed the database (`prisma/seed.ts`)
11. Build the main app shell: Sidebar + layout + channel routing
12. Build the Socket.io custom server (`server/socket-server.ts`)
13. Build the MessageList + MessageItem (real-time via socket)
14. Build the MessageComposer (Tiptap, file upload, @mention, /poll)
15. Build threads (MessageThread panel)
16. Build reactions, emoji picker
17. Build DMs (1-on-1 and group)
18. Build Pinned messages
19. Build global Search modal
20. Build Task kanban board
21. Build polls (slash command + PollCard)
22. Build the Admin dashboard (all 7 sections)
23. Configure PWA: manifest, service worker, push notifications, install prompt
24. Implement offline queue with IndexedDB + Background Sync
25. Build the Nginx config
26. Build the multi-stage Dockerfile
27. Write the full README

---

## README CONTENTS

The `README.md` must cover:
- What Pi-Chat is (1 paragraph)
- System requirements (Docker, Docker Compose 2.x, a domain, Ubuntu LTS)
- Google OAuth setup (step-by-step with OAuth consent screen config, authorized redirect URIs)
- Clone + configure: `cp .env.example .env`, fill in each variable with explanation
- Generate VAPID keys: `npx web-push generate-vapid-keys`
- `docker compose up -d` — what it starts, what ports are exposed
- SSL setup with Certbot on Ubuntu: exact commands for Let's Encrypt
- How to update: `git pull`, `docker compose up -d --build`
- Admin guide: first login, inviting members, managing roles, creating channels
- Backup guide: `pg_dump` command, MinIO `mc mirror` command, example cron job
- Troubleshooting: common issues (socket not connecting, file uploads failing, push not working)

---

*Build Pi-Chat to last. FRC Team 1676 — The Pascack Pi-oneers.*
