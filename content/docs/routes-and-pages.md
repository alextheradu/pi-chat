# Routes and Pages

This document covers the current route surface.

## Public pages

- `/site`: open source website route
- `/docs`: docs index
- `/docs/[slug]`: public markdown docs
- `/login`: team login page

## Protected pages

- `/`: authenticated workspace entry
- `/integrations`: incoming webhook management
- `/channel/[id]`: channel view
- `/dm/[id]`: direct message view
- `/tasks`: task board
- `/settings`: user settings

Additional protected product routes are expected later as more of the app shell is implemented.

## API routes

- `/api/auth/[...nextauth]`
  - NextAuth route handler for login and callbacks
- `/api/health`
  - checks Postgres and MinIO connectivity
- `/api/integrations/webhooks`
  - `GET`: list current webhooks and channels for an authorized operator
  - `POST`: create a new incoming webhook
- `/api/integrations/webhooks/[id]`
  - `DELETE`: revoke a webhook
- `/api/hooks/[token]`
  - `POST`: accept message delivery from an external application

## Route protection

`proxy.ts` keeps the public surface small. App pages outside the known public routes require an authenticated user session.

## Docs behavior

The docs pages are static markdown-backed pages generated from files in `docs/site/`.
