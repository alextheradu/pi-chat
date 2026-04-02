# Getting Started

Pi-Chat is an open-source, self-hosted Slack alternative. This page covers what you need to run it locally.

## Prerequisites

- Node.js 20 or later
- Docker and Docker Compose (for local Postgres and MinIO)
- A Google Cloud project with OAuth credentials

## Clone the repository

```bash
git clone https://github.com/alextheradu/pi-chat.git
cd pi-chat
```

## Install dependencies

```bash
npm install
```

## Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pichat"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Access policy
ALLOWED_DOMAIN="yourteam.org"
ADMIN_EMAIL="admin@yourteam.org"

# MinIO / S3 storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="pichat"
```

## Start local services

Spin up PostgreSQL and MinIO with Docker Compose:

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Run database migrations

```bash
npm run db:migrate:deploy
```

## Seed initial data

```bash
npm run db:seed
```

## Start the development server

```bash
npm run dev
```

The app starts on `http://localhost:3001` by default. Open it in a browser and sign in with a Google account that matches `ALLOWED_DOMAIN`.

## Verify dependencies are healthy

```bash
npm run test:db
npm run test:minio
```

Both should report success. If not, check that Docker containers are running and your `.env` values are correct.
