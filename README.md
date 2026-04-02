# Pi-Chat

Pi-Chat is the self-hosted team chat application. This repo is the actual workspace app, not the public marketing site.

The public website and docs now live in the sibling project at [/public-site](https://github.com/alextheradu/pi-chat/tree/public-site).

A web version (and probably more updated) docs are available at [pi-chat.org](https://pi-chat.org)

## Table Of Contents

- [Overview](#overview)
- [Public Docs](#public-docs)
- [Repo Split](#repo-split)
- [What Ships Today](#what-ships-today)
- [What Is Planned](#what-is-planned)
- [Stack](#stack)
- [Repository Layout](#repository-layout)
- [Routes](#routes)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Database And Seeding](#database-and-seeding)
- [Integrations And Bots](#integrations-and-bots)
- [Smoke Tests](#smoke-tests)
- [Production Deployment](#production-deployment)
- [Operations](#operations)
- [Troubleshooting](#troubleshooting)

## Overview

This repository is aimed at teams that want a Slack-style system they can self-host and control. The product intent includes channels, DMs, threads, moderation, tasks, uploads, PWA support, and a combined Next.js plus Socket.io runtime. The current branch implements the secure foundation, the authenticated app shell, and the first external integration slice.

## Public Docs

The public website and docs for Pi-Chat live in the separate site project:

- public site: https://pi-chat.org/
- docs index: https://pi-chat.org/docs/
- site repo: [../pi-chat-site](/srv/md0/robotics/pi-chat-site)

If you want to update the public docs, submit a pull request against the site repo. Do not add public docs pages in this app repo.

## Repo Split

The project is now split into two separate apps:

- [pi-chat](/srv/md0/robotics/pi-chat): the real chat application, login flow, APIs, database, storage, and workspace UI
- [pi-chat-site](/srv/md0/robotics/pi-chat-site): the public website and documentation

That means:

- the chat host should point at this repo
- the public website host should point at the sibling site repo
- this repo no longer serves `/site` or `/docs`

## What Ships Today

- Google OAuth login at `/login`
- domain-restricted sign-in with invite-based exceptions
- bootstrap admin promotion based on `ADMIN_EMAIL`
- authenticated app shell with sidebar, channel routes, DMs scaffold, tasks, search, and settings
- Prisma 7 schema and migrations
- Postgres-backed persistence
- MinIO connectivity and bucket initialization
- `/api/health` for dependency health checks
- incoming webhook management UI at `/integrations`
- incoming webhook delivery API at `/api/hooks/[token]`
- production-ready `next build` and `next start`
- production Docker Compose stack

## What Is Planned

The implementation plans under `docs/superpowers/plans/` still describe a larger product. Major planned slices include:

- richer channels and messaging UI
- DMs, threads, and search completion
- admin dashboard
- uploads and file workflows
- offline and push features
- single custom Node runtime for Next.js and Socket.io
- mobile app completion

## Stack

- Next.js `16.2.1`
- React `19.2.4`
- TypeScript `5`
- Prisma `7.5.0`
- NextAuth `5.0.0-beta.30`
- PostgreSQL `16`
- MinIO
- Framer Motion
- TanStack Query
- Tailwind CSS `4`

## Repository Layout

Key paths:

- `app/`: App Router pages, layouts, and route handlers
- `app/(app)/`: authenticated app routes
- `app/(auth)/login/`: login route and interactive login client
- `app/api/`: auth, health, webhook management, push registration, settings, and incoming hook endpoints
- `app/integrations/`: protected webhook management UI
- `lib/`: auth, config, permissions, MinIO, Prisma, and webhook helpers
- `prisma/`: schema, migrations, and seed logic
- `docs/superpowers/plans/`: implementation plans and roadmap intent
- `docker/`: Dockerfile and entrypoint
- `scripts/`: runtime storage init and production seed scripts
- `tests/smoke/`: environment-backed smoke tests

## Routes

Public routes:

- `/login`
- `/api/auth/[...nextauth]`
- `/api/auth/mobile-signin`
- `/api/health`
- `/api/hooks/[token]`

Protected routes:

- `/`
- `/channel/[id]`
- `/dm/[id]`
- `/search`
- `/tasks`
- `/settings`
- `/integrations`

Route access is enforced in [proxy.ts](/srv/md0/robotics/pi-chat/proxy.ts), and sensitive handlers still check auth and permissions server-side.

## Environment Variables

The checked-in defaults are examples only. Replace them before using the app for a real deployment.

### Branding And Identity

| Variable | Example default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Pi-Chat` | Visible app name used in metadata and login UI |
| `TEAM_NAME` | `Your Team` | Team label shown in auth and shell surfaces |
| `TEAM_MEMBER_SINGULAR` | `Member` | Login wording |
| `TEAM_MEMBER_PLURAL` | `Members` | Sidebar wording |

### Auth And Access Policy

| Variable | Example default | Purpose |
| --- | --- | --- |
| `NEXTAUTH_SECRET` | empty | Required session secret |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | empty | Google OAuth client secret |
| `ADMIN_EMAIL` | `john@example.com` | Bootstrap admin email checked during sign-in |
| `ALLOWED_DOMAIN` | `example.com` | Default allowed sign-in domain |

Notes:

- users within `ALLOWED_DOMAIN` are auto-approved
- users outside `ALLOWED_DOMAIN` need a valid invite
- banned users are blocked at sign-in

### Runtime URLs

| Variable | Example default | Purpose |
| --- | --- | --- |
| `DEV_PORT` | `3001` | Default local development port for `npm run dev` |
| `NEXTAUTH_URL` | `http://localhost:3001` | Public auth callback origin |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | App base URL for links and hooks |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Reserved for future combined realtime server |
| `PORT` | `3000` | App port |
| `NODE_ENV` | `development` | Runtime mode |

### Database And Storage

| Variable | Example default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://teamchat:changeme@localhost:5436/teamchat` | Prisma and app database connection |
| `POSTGRES_USER` | `teamchat` | Local and Docker Postgres user |
| `POSTGRES_PASSWORD` | `changeme` | Local and Docker Postgres password |
| `MINIO_ENDPOINT` | `localhost` | MinIO hostname |
| `MINIO_PORT` | `9010` | MinIO API port in local dev |
| `MINIO_USE_SSL` | `false` | MinIO TLS toggle |
| `MINIO_ACCESS_KEY` | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | `changeme` | MinIO secret key |
| `MINIO_BUCKET_FILES` | `teamchat-files` | Uploads bucket |
| `MINIO_BUCKET_AVATARS` | `teamchat-avatars` | Avatar bucket |

### Integrations And Future Email/PWA Settings

| Variable | Example default | Purpose |
| --- | --- | --- |
| `BOT_EMAIL_DOMAIN` | `bots.teamchat.local` | Local domain used for generated webhook bot identities |
| `VAPID_PUBLIC_KEY` | empty | Future web-push public key |
| `VAPID_PRIVATE_KEY` | empty | Future web-push private key |
| `VAPID_SUBJECT` | `mailto:admin@example.com` | Future web-push contact |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | empty | Future frontend push key |
| `SMTP_*` | empty/example | Reserved for future invite email support |
| `RESEND_API_KEY` | empty | Reserved for future Resend support |

## Local Development

### 1. Install dependencies

```bash
npm ci
```

### 2. Create your env file

```bash
cp .env.example .env
```

At minimum, replace:

- `ADMIN_EMAIL`
- `ALLOWED_DOMAIN`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 3. Start local infrastructure

```bash
docker compose -f docker-compose.dev.yml up -d
```

Local service ports:

- Postgres: `localhost:5436`
- MinIO API: `localhost:9010`
- MinIO console: `localhost:9011`

### 4. Apply migrations and seed data

```bash
npm run db:migrate:deploy
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

Useful local URLs:

- app: `http://localhost:3001`
- login: `http://localhost:3001/login`
- health: `http://localhost:3001/api/health`
- MinIO console: `http://localhost:9011`

## Database And Seeding

The schema is defined in [prisma/schema.prisma](/srv/md0/robotics/pi-chat/prisma/schema.prisma). Seed behavior exists in two places:

- [prisma/seed.ts](/srv/md0/robotics/pi-chat/prisma/seed.ts): development and local bootstrap seed
- [scripts/seed-production.mjs](/srv/md0/robotics/pi-chat/scripts/seed-production.mjs): idempotent runtime seed used by the Docker entrypoint

Useful commands:

```bash
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:seed:runtime
```

## Integrations And Bots

This branch includes the first application-facing API slice: incoming webhooks.

Management surface:

- page: `/integrations`
- list/create API: `GET` and `POST /api/integrations/webhooks`
- revoke API: `DELETE /api/integrations/webhooks/[id]`

Only users with the `integration:webhook:manage` permission can manage webhooks. Right now that means `ADMIN` and `MODERATOR`.

Delivery endpoint:

```text
POST /api/hooks/{token}
```

Example:

```bash
curl -X POST https://chat.example.com/api/hooks/pichat_wh_your_secret_here \
  -H 'Content-Type: application/json' \
  -d '{"text":"Build server says the new image is healthy."}'
```

## Smoke Tests

This repo includes environment-backed smoke tests for the core services:

- `tests/smoke/database.test.mjs`: verifies Postgres connectivity
- `tests/smoke/minio.test.mjs`: verifies MinIO connectivity and bucket addressability
- `tests/smoke/health.test.mjs`: verifies the combined runtime health checks

Available commands:

```bash
npm run test
npm run test:smoke
npm run test:db
npm run test:minio
npm run test:health
```

## Production Deployment

This branch supports two production paths:

- direct Node deployment using `next build` and `next start`
- Docker Compose deployment using [docker-compose.yml](/srv/md0/robotics/pi-chat/docker-compose.yml)

The long-term roadmap still calls for a custom combined Next.js and Socket.io server, but that server is not part of this branch yet.

### Option A: Direct Node Deployment

1. Install dependencies: `npm ci`
2. Configure `.env` with production values
3. Apply migrations: `npm run db:migrate:deploy`
4. Seed bootstrap data if needed: `npm run db:seed`
5. Build and start:

```bash
npm run build
PORT=3000 npm run start
```

### Option B: Docker Compose Deployment

1. Copy the env template:

```bash
cp .env.example .env
```

2. Replace the example values and update Docker-specific networking:

- `NODE_ENV=production`
- `NEXTAUTH_URL=https://chat.example.com`
- `NEXT_PUBLIC_APP_URL=https://chat.example.com`
- `NEXT_PUBLIC_SOCKET_URL=https://chat.example.com`
- `DATABASE_URL=postgresql://pichat:<password>@postgres:5432/pichat`
- `MINIO_ENDPOINT=minio`
- `MINIO_PORT=9000`
- `MINIO_USE_SSL=false`

3. Build and start the stack:

```bash
docker compose up --build -d
```

4. Verify the service:

```bash
curl http://127.0.0.1:3014/api/health
```

The app container applies Prisma migrations, ensures MinIO buckets exist, seeds bootstrap data, and starts the standalone Next.js server.

## Operations

Useful commands:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run test:minio
npm run test:health
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run db:seed:runtime
npm run storage:init
```

Health check:

```bash
curl http://127.0.0.1:3000/api/health
```

## Troubleshooting

### Login rejected for a valid team member

Check:

- `ALLOWED_DOMAIN`
- Google OAuth callback URLs
- whether the user is marked as banned

### External user cannot sign in

Check that:

- an invite exists for the exact email
- the invite is unused
- the invite has not expired

### Webhook requests return `404`

Check that:

- the token is correct
- the webhook has not been revoked
- the app URL used to store or copy the hook is correct

### Public website/docs no longer exist in this repo

That is expected. Use the sibling project at [../pi-chat-site](/srv/md0/robotics/pi-chat-site) for the marketing homepage and docs deployment.
