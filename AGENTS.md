<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Intent

Pi-Chat is a production-grade, self-hosted Slack replacement for FRC Team 1676. The plans describe a team chat product with Google auth, channel messaging, DMs, threads, moderation/admin tooling, tasks, PWA support, file uploads, and Docker-based deployment.

## Source Of Truth

- Use `package.json`, `prisma/schema.prisma`, existing code, and `node_modules/next/dist/docs/` as implementation truth.
- Use `docs/superpowers/plans/` as the product roadmap and feature intent.
- Do not use `README.md` as a source of truth here; it is still mostly default scaffold text.
- The plans were written around Next.js 15 / Prisma 5 assumptions, but this repo currently uses Next 16, React 19, and Prisma 7. Reconcile that mismatch before changing code.

## How To Approach Work

1. Read the relevant phase plan file(s) in `docs/superpowers/plans/`.
2. Compare the plan against the current implementation and installed dependency versions.
3. Read the matching local Next.js docs in `node_modules/next/dist/docs/` before writing code.
4. Implement the smallest end-to-end slice that advances the next incomplete phase.
5. Adapt outdated plan snippets to the current stack instead of copying them verbatim.

## Product Priorities

- Phase 1: foundation work: database, Prisma schema/migrations, seed data, auth, permissions, login, health checks.
- Phase 2: app shell: authenticated layout, sidebar, channel and DM routing, search/task scaffolding.
- Phase 3: messaging core: single custom Node server for Next.js + Socket.io, message APIs, hooks, composer, reactions, sanitization.
- Phase 4: collaboration features: DMs, group DMs, threads, pinned messages, global search.
- Phase 5: admin surface: protected `/admin` area with members, channels, roles, invites, audit log, broadcast.
- Phase 6: completion and ops: task board, uploads, PWA, push notifications, offline queue, Docker/Nginx/MinIO deployment.

## Non-Negotiables

- Keep the team-specific domain model: `@example.com` is the default allowed sign-in domain, with invite-based exceptions.
- Preserve the bootstrap admin behavior for `john@example.com` unless explicitly told otherwise.
- Preserve the "Precision Dark" visual direction: black/gray base, yellow accent, no blue/purple/navy UI chrome.
- Prefer App Router patterns and keep client boundaries narrow; default to server components unless interactivity requires a client component.
- Treat auth, permissions, sanitization, uploads, and admin access as security-critical code.

## Practical Guidance

- The repo is only partially built. Some Phase 1 foundation exists, while large parts of the shell, messaging, admin, and ops roadmap are still missing.
- Replace scaffold/default app code before adding polish.
- When plan snippets conflict with the design system or current dependencies, preserve the product intent and adapt the implementation.
- Keep Prisma schema changes and migrations aligned.
- For Phase 3 and later work, remember the intended deployment model is a single custom Node process handling both Next.js and Socket.io.
