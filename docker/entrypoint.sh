#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Ensuring MinIO buckets..."
node ./scripts/init-minio.mjs

echo "Seeding bootstrap data..."
node ./scripts/seed-production.mjs

echo "Starting ${APP_NAME:-Pi-Chat}..."
exec node server.js
