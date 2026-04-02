# Self-Hosting

Pi-Chat is designed to run on infrastructure you control. The recommended production path uses Docker Compose with the included configuration.

## What you need

- A server running Docker and Docker Compose
- A domain name with HTTPS (required for Google OAuth)
- A Google Cloud project with OAuth credentials
- Outbound internet access for Google sign-in callbacks

## Clone and configure

```bash
git clone https://github.com/alextheradu/pi-chat.git
cd pi-chat

cp .env.example .env
```

Edit `.env` with your production values. Key variables to set:

```env
DATABASE_URL="postgresql://pichat:yourpassword@db:5432/pichat"
NEXTAUTH_URL="https://chat.yourdomain.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
ALLOWED_DOMAIN="yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
MINIO_ENDPOINT="minio"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
```

## Start the stack

```bash
docker compose up --build -d
```

This starts three containers:

- `app`: the Next.js server
- `db`: PostgreSQL
- `minio`: object storage

The entrypoint automatically applies migrations, creates storage buckets, and runs the bootstrap seed before starting the server.

## Check health

```bash
curl https://chat.yourdomain.com/api/health
```

Expected response:

```json
{ "db": "ok", "minio": "ok" }
```

## View logs

```bash
docker compose logs -f app
```

## Reverse proxy

Put Nginx, Caddy, or a cloud load balancer in front of the app container. The Next.js server listens on port `3001` by default. Configure your proxy to terminate TLS and forward to that port.

Caddy example:

```
chat.yourdomain.com {
  reverse_proxy localhost:3001
}
```

## Updating

```bash
git pull
docker compose up --build -d
```

Migrations run automatically on each container restart.

## Backup

Back up PostgreSQL with:

```bash
docker compose exec db pg_dump -U pichat pichat > backup.sql
```

Back up MinIO by copying the bucket data, or configure MinIO with a remote backend that handles its own redundancy.

## Environment variable reference

See the [Configuration](/docs/configuration/) doc for the full list of environment variables.
