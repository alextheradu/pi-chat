# Repository Tour

This is a practical map of the Pi-Chat workspace repository at `github.com/alextheradu/pi-chat`.

## App routes

- `app/page.tsx`: authenticated workspace entry, redirects to active channel
- `app/(public)/site/page.tsx`: public website route
- `app/(public)/docs/page.tsx`: public docs index
- `app/(public)/docs/[slug]/page.tsx`: markdown-backed docs pages
- `app/(auth)/login/page.tsx`: server login route wrapper
- `app/(auth)/login/login-page-client.tsx`: interactive login UI
- `app/api/auth/[...nextauth]/route.ts`: NextAuth route handler
- `app/api/health/route.ts`: database and MinIO health endpoint
- `app/api/integrations/webhooks/route.ts`: authenticated webhook management API
- `app/api/integrations/webhooks/[id]/route.ts`: revoke webhook
- `app/api/hooks/[token]/route.ts`: public incoming webhook delivery endpoint
- `app/integrations/page.tsx`: protected webhook management page

## Core libraries

- `lib/auth.ts`: sign-in callbacks and domain/invite enforcement
- `lib/project-config.ts`: branding and policy values read from environment
- `lib/prisma.ts`: Prisma client singleton
- `lib/minio.ts`: MinIO client and bucket helpers
- `lib/incoming-webhooks.ts`: webhook token generation and hashing
- `lib/permissions.ts`: role-based permission matrix

## Styling

- `app/globals.css`: design tokens (Pi-Chat Precision Dark palette) and global styles
- `app/layout.tsx`: root metadata, fonts (DM Sans + JetBrains Mono), and providers

## Database

- `prisma/schema.prisma`: full data model
- `prisma/migrations/`: migration history
- `prisma/seed.ts`: development seed data
- `prisma.config.ts`: Prisma CLI config

## Deployment

- `docker-compose.dev.yml`: local Postgres and MinIO for development
- `docker-compose.yml`: production stack with app, Postgres, and MinIO
- `docker/Dockerfile`: production image using Next.js standalone output
- `docker/entrypoint.sh`: migrate, init storage, seed, then start the server

## Scripts

- `scripts/init-minio.mjs`: creates required MinIO buckets
- `scripts/seed-production.mjs`: idempotent bootstrap seed for container startup

## Tests

- `npm run test:db`: verifies PostgreSQL connectivity
- `npm run test:minio`: verifies MinIO connectivity and bucket access
- `npm run test:health`: runs the combined health check
