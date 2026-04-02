# Pi-Chat Site

This is the static public website and docs companion app for Pi-Chat.

Use this project for:

- the marketing homepage
- public documentation
- linking to the main repository

Use the main chat app in [/srv/md0/robotics/pi-chat](/srv/md0/robotics/pi-chat) for:

- login
- channels
- DMs
- integrations
- the self-hosted workspace itself

## Local development

1. Run `npm install`
2. Run `npm run dev`
3. Open `http://localhost:3002`

## Static build

Run `npm run build` to generate the static site in `out/`.

Use `npm run start` to preview the exported files locally, or deploy `out/` directly to GitHub Pages, Vercel, Netlify, or any static host.
