FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true
ENV APP_NAME=Pi-Chat
ENV TEAM_NAME=FRC Team 1676
ENV TEAM_MEMBER_SINGULAR=Pioneer
ENV TEAM_MEMBER_PLURAL=Pi-oneers
ENV PROJECT_REPOSITORY_URL=https://github.com/alextheradu/pi-chat
ENV NEXTAUTH_URL=http://127.0.0.1:3000
ENV NEXTAUTH_SECRET=build-only-secret
ENV NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
ENV NEXT_PUBLIC_SOCKET_URL=http://127.0.0.1:3000
ENV GOOGLE_CLIENT_ID=build-only-google-client-id
ENV GOOGLE_CLIENT_SECRET=build-only-google-client-secret
ENV DATABASE_URL=postgresql://pichat:changeme@127.0.0.1:5432/pichat
ENV POSTGRES_USER=pichat
ENV POSTGRES_PASSWORD=changeme
ENV MINIO_ENDPOINT=127.0.0.1
ENV MINIO_PORT=9000
ENV MINIO_USE_SSL=false
ENV MINIO_ACCESS_KEY=minioadmin
ENV MINIO_SECRET_KEY=changeme
ENV MINIO_BUCKET_FILES=pi-chat-files
ENV MINIO_BUCKET_AVATARS=pi-chat-avatars
ENV ADMIN_EMAIL=john@example.com
ENV ALLOWED_DOMAIN=example.com
ENV BOT_EMAIL_DOMAIN=bots.pi-chat.local

FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate
RUN npm run build

FROM base AS prod-deps

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh

USER nextjs

EXPOSE 3000

CMD ["./docker/entrypoint.sh"]
