# Operations

This document covers the current operational commands and checks.

## Local development

```bash
npm ci
docker compose -f docker-compose.dev.yml up -d
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Local development defaults to `http://localhost:3001` unless you override `DEV_PORT`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test
```

## Smoke tests

The repo includes smoke tests for the live runtime dependencies:

```bash
npm run test:db
npm run test:minio
npm run test:health
```

Notes:

- `test:db` checks the configured PostgreSQL connection.
- `test:minio` checks the configured MinIO connection and bucket addressability.
- `test:health` checks the combined runtime health status for PostgreSQL and MinIO.
- You can point the smoke tests at alternate targets with `SMOKE_*` overrides such as `SMOKE_DATABASE_URL` or `SMOKE_MINIO_ENDPOINT`.

## Production Docker

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

## Runtime startup order

The production app container:

1. applies migrations
2. creates MinIO buckets
3. runs idempotent bootstrap seed data
4. starts the Next.js server

## Health

Use:

```bash
curl http://127.0.0.1:3000/api/health
```

Expected result:

- `db: ok`
- `minio: ok`

## Useful scripts

- `npm run db:generate`
- `npm run db:migrate:deploy`
- `npm run db:seed`
- `npm run db:seed:runtime`
- `npm run storage:init`

## Integration operations

- create webhook from `/integrations`
- copy the one-time webhook URL immediately
- revoke and recreate if a secret leaks
