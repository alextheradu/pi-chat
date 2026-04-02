# Architecture

Pi-Chat is a Next.js 16 application using the App Router. It runs a standalone Node server backed by PostgreSQL and MinIO, with NextAuth handling Google OAuth.

## Runtime services

A fully running Pi-Chat deployment needs four services:

| Service | Role |
|---|---|
| Next.js standalone server | Renders the UI and serves API routes |
| PostgreSQL | Primary database for all user, channel, and message data |
| MinIO (or S3) | Object storage for file attachments |
| (Phase 3) Socket.io server | Realtime event delivery for messaging |

In the current phase, Socket.io is not yet running. The app works without it, but messages are not pushed in real time.

## Application layers

### Routing

The App Router is split into route groups:

- `(public)`: login page, public website, and docs. No session required.
- `(app)`: the authenticated workspace shell, channels, DMs, settings.
- `(auth)`: sign-in and OAuth callback handling.
- `admin`: admin dashboard (planned, Phase 5).

### API routes

All API routes live under `app/api/`. Key endpoints:

- `/api/auth/[...nextauth]`: NextAuth handler
- `/api/health`: checks Postgres and MinIO connectivity
- `/api/integrations/webhooks`: CRUD for incoming webhooks
- `/api/hooks/[token]`: public endpoint that accepts webhook deliveries from external apps

### Data layer

Prisma connects to PostgreSQL. The schema is defined in `prisma/schema.prisma` and versioned through migration files. The Prisma client is a singleton in `lib/prisma.ts`.

### Storage layer

File attachments are stored in a MinIO bucket. The storage client is initialized in `lib/minio.ts`. The production Docker entrypoint creates required buckets at startup via `scripts/init-minio.mjs`.

### Auth layer

NextAuth v5 handles sign-in through `lib/auth.ts`. The sign-in callback enforces the domain restriction and invite check before creating a session. See the Authentication doc for the full policy.

### State management

Client-side state is handled with Zustand. Store slices cover channel membership, active channel context, and UI state.

## Request lifecycle

1. Browser makes a request.
2. `proxy.ts` middleware checks whether the route is public or requires a session.
3. Public routes serve immediately. Protected routes redirect unauthenticated users to `/login`.
4. Server Components fetch data from Prisma and pass it to the UI.
5. Client Components handle interactions and update Zustand state.
6. Mutations go through API routes, which enforce auth and permission checks server-side.

## Production startup order

The Docker entrypoint runs these steps before starting Next.js:

1. Apply all pending Prisma migrations
2. Create MinIO buckets if they do not exist
3. Run idempotent bootstrap seed (admin account, default channel)
4. Start the Next.js standalone server

## Planned: realtime server

Phase 3 will introduce a custom Node server that mounts both Next.js and Socket.io on the same port. The Socket.io layer will push new messages, reactions, and presence updates to connected clients without polling.
