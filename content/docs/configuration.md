# Configuration

Pi-Chat is configured entirely through environment variables. Copy `.env.example` to `.env` and set the values described below before running the app.

## Database

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |

## Authentication

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Full public URL of your deployment |
| `NEXTAUTH_SECRET` | Random secret used to sign session tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

Generate a strong `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## Access policy

| Variable | Description |
|---|---|
| `ALLOWED_DOMAIN` | Google accounts in this domain can sign in without an invite |
| `ADMIN_EMAIL` | Email address that receives admin role on first sign-in |

Only accounts whose email ends with `@ALLOWED_DOMAIN` are allowed to sign in by default. All other users need an explicit invite from an admin.

## Object storage

Pi-Chat stores file attachments in any S3-compatible bucket. MinIO is used locally.

| Variable | Description |
|---|---|
| `MINIO_ENDPOINT` | Storage endpoint hostname |
| `MINIO_PORT` | Storage endpoint port (default `9000`) |
| `MINIO_ACCESS_KEY` | Access key |
| `MINIO_SECRET_KEY` | Secret key |
| `MINIO_BUCKET` | Bucket name (default `pichat`) |
| `MINIO_USE_SSL` | Set to `true` for HTTPS endpoints |

## App branding

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Display name shown in the UI |
| `NEXT_PUBLIC_TEAM_NAME` | Team name shown in onboarding and emails |

## Optional

| Variable | Description |
|---|---|
| `DEV_PORT` | Override the local dev server port (default `3001`) |
| `SMOKE_DATABASE_URL` | Alternate database URL for smoke tests |
| `SMOKE_MINIO_ENDPOINT` | Alternate MinIO endpoint for smoke tests |

## Google OAuth setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the Google+ API.
3. Create OAuth 2.0 credentials with type Web Application.
4. Add `http://localhost:3001/api/auth/callback/google` as an authorized redirect URI for local development.
5. Add your production URL with the same callback path for production.
6. Copy the client ID and secret into `.env`.
