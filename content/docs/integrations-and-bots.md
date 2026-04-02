# Integrations and Bots

The current branch now includes a first integrations slice: incoming webhooks.

## What exists today

The current branch supports:

- webhook creation by authorized operator accounts
- a dedicated bot user per webhook
- channel-targeted message delivery from external applications
- webhook revocation

## Management page

Authorized users can manage webhooks at:

- `/integrations`

Current permission rule:

- `ADMIN` and `MODERATOR` can manage incoming webhooks

## Management API

### List webhooks

`GET /api/integrations/webhooks`

Returns current webhooks and available channels for an authenticated authorized user.

### Create webhook

`POST /api/integrations/webhooks`

JSON body:

```json
{
  "name": "Build Alerts",
  "description": "Posts CI results into general",
  "channelSlug": "general"
}
```

Response includes:

- created webhook metadata
- one-time secret token
- full webhook URL

### Revoke webhook

`DELETE /api/integrations/webhooks/{id}`

Revocation prevents any future deliveries from that secret URL.

## Incoming delivery endpoint

External applications post to:

`POST /api/hooks/{token}`

JSON body:

```json
{
  "text": "Deployment complete."
}
```

Notes:

- `text` is required
- text is limited to 4000 characters
- the token URL is the secret
- revoked or unknown tokens return `404`

## Example

```bash
curl -X POST https://your-domain/api/hooks/pichat_wh_your_secret_here \
  -H 'Content-Type: application/json' \
  -d '{"text":"Build server says the new image is healthy."}'
```

## Current limits

This is intentionally a first slice, not a full app platform. It does not yet include:

- scoped API tokens
- outgoing webhooks
- slash commands
- OAuth app installs
- bot event subscriptions
- granular bot permissions
- message formatting or attachments

Those can be added later on top of the current webhook foundation.
