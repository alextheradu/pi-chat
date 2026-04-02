# Project Overview

Pi-Chat is an open-source, self-hosted team communication platform. It is a Slack alternative built for teams that want full control over where their data lives and who can access it.

## Why Pi-Chat exists

Most team chat tools are SaaS. Your messages, files, and history live on someone else's servers under someone else's terms. Pi-Chat is built on the premise that a team should be able to run their own workspace, on their own hardware, with no external dependencies at runtime.

## What Pi-Chat ships today

- Google OAuth sign-in with domain restriction and invite-based exceptions
- Channel-based team messaging
- Direct messages and group DMs
- Incoming webhooks for external application and bot integrations
- Role-based access control with admin, moderator, member, and guest roles
- Task boards
- File attachment support via MinIO-compatible object storage
- Docker-based production deployment
- Health checks for database and storage
- PWA support

## What is still in progress

- Real-time messaging via a custom Socket.io server (Phase 3)
- Threads and global search (Phase 4)
- Admin dashboard and member management UI (Phase 5)
- Push notifications (Phase 6)
- Native iOS and Android apps via Capacitor (Phase 7)

## Who can access a Pi-Chat workspace

Access is not open by default. Sign-in is restricted to Google accounts in a configured domain. People outside that domain need an admin-issued invite. This is by design: Pi-Chat is built for a real team, not a public forum.

## Tech stack

- Next.js 16 with the App Router
- Prisma 7 with PostgreSQL
- NextAuth v5 with Google OAuth
- MinIO-compatible object storage
- Zustand for client-side state
- Docker for production deployment
- Socket.io planned for the realtime server (Phase 3)
