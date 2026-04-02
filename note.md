# Note For Claude

When you return to this repo, the next structural pass should make Pi-Chat fully brandable and open-source friendly without losing the current Team 1676 defaults.

## Goal

Keep the app customized to Team 1676 for now, but remove hardcoded branding assumptions from the implementation so another team or organization can adopt it with configuration instead of code surgery.

## What Should Become Customizable

- App name, short name, and wordmark text
- Organization name and subtitle copy
- Logo assets, favicon, manifest icons, and login branding
- Color palette and CSS theme tokens
- Default metadata, SEO text, and browser theme color
- Allowed auth domain and bootstrap admin email
- Production and staging domains
- Seeded subdivisions, seeded channels, and default descriptions
- Email sender name/address and invite copy
- Any team-specific strings like "Team 1676", "Pi-Chat", "Pascack", or "Pi-oneers"

## Preferred Approach

- Add a typed checked-in branding config, not scattered literals.
- Keep secrets and deployment values in `.env`, but keep visual branding and product identity in code config.
- Centralize theme tokens so one branding source drives `globals.css`, metadata, manifest values, and auth/login copy.
- Centralize seed defaults so channels/subdivisions come from configuration instead of being embedded directly in `prisma/seed.ts`.
- Preserve current Team 1676 values as the default config shipped in the repo.

## Important Constraint

Do not genericize the current product experience first and figure out Team 1676 later. The repo should still boot with the current Team 1676 identity by default; the work is to introduce a clean override/config layer around it.
