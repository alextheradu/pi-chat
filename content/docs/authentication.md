# Authentication Policy

This project is intentionally not open signup software.

## Default sign-in rule

By default, sign-in is limited to Google accounts in the domain configured by `ALLOWED_DOMAIN`. That is the default team login path.

## Invited external users

People outside the configured `ALLOWED_DOMAIN` are not allowed to sign in unless an admin has created a valid invite for their exact email address.

The current auth flow checks for:

- a matching email
- an unused invite
- an invite that has not expired

If no valid invite exists, sign-in is rejected.

## Bootstrap admin

The bootstrap admin is controlled by `ADMIN_EMAIL`. The checked-in example value is `john@example.com`.

## Banned users

If a user is marked as banned in the database, sign-in is blocked even if they match the domain rule or were previously invited.

## Why this is strict

The application is built for a real team, so access control is treated as part of the product, not a later add-on. Public visitors can browse the project and docs, but member access remains restricted.
