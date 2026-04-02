# Data Model

The current codebase already has a broad Prisma schema even though the UI is still catching up.

## Core identity

- `User`: primary identity record
- `Role`: access level such as `ADMIN`, `MODERATOR`, `MEMBER`, or `GUEST`
- `Invite`: invite-based exception path for users outside the configured `ALLOWED_DOMAIN`

## Channels and messaging

- `Channel`
- `ChannelMember`
- `Message`
- `Reaction`
- `Attachment`
- `PinnedMessage`
- `LinkPreview`

These models are the backbone for team communication.

## Direct communication

- `DirectMessage`
- `DMAttachment`
- `GroupDM`
- `GroupDMMember`
- `GroupDMMessage`

## Collaboration

- `Task`
- `Subdivision`
- `SubdivisionMember`
- `Poll`
- `PollOption`
- `PollVote`

## Operations and platform

- `PushSubscription`
- `AuditLog`
- `IncomingWebhook`

## Incoming webhooks

`IncomingWebhook` is the first integrations-focused model in the schema.

It stores:

- the webhook name
- optional description
- target channel
- creator
- dedicated bot user
- hashed secret token
- token preview
- revocation state
- last-used timestamp

The bot posts messages using the normal `Message` model, so webhook traffic lands in the same canonical message table as human activity.
