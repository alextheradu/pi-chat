# Roadmap

The public project makes it clear what is real today and what is still planned.

## Shipped

- public website and docs
- login page with Google OAuth
- domain restriction and invite exception flow
- Prisma schema and migrations
- Docker path for standalone Next.js
- health checks
- incoming webhook integrations
- authenticated app shell with sidebar and channel routing
- Zustand global state and shared components

## In progress / planned

### Phase 3

- custom combined Next.js + Socket.io server
- real-time channel messaging
- reactions and typing indicators

### Phase 4

- direct messages
- group DMs
- threads
- global search

### Phase 5

- admin dashboard
- member management, channel management, role management
- invite UI and audit log

### Phase 6

- task board
- file uploads
- push notifications (web / PWA)
- offline message queue

### Phase 7

- native iOS and Android apps via Capacitor
- mobile Google Sign-In with JWT auth
- mobile push notifications (FCM / APNs)
- dark / light / system theme toggle

## Source of truth

The implementation plans in `docs/superpowers/plans/` describe the intended design. The actual working state is always the code and these public docs.
