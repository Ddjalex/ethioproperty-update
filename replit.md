# EthioProperty / Prime Addis

## Overview
A real-estate listing site for Addis Ababa, Ethiopia ("EthioProperty" / "Prime Addis" branding). Full-stack Express + React app with property listings, an admin panel, a Gemini-powered "Ask AI" chat widget, lead capture/newsletter subscription, and a blog.

## Architecture notes (important — imported project)
- This repo does **not** contain live `server/`/`client/` source. The runnable app is the pre-built bundle at `dist/dist/index.js` (server) serving `dist/dist/public` (static client) and a set of runtime "patch" JS files injected into the page.
- `_source_primeaddis/` and the zip archives (`dub.zip`, `zipFile.zip`) are older/reference compiled copies — not the canonical source. Do not copy branding, colors, footer, logo, or SEO tags from `_source_primeaddis`; it belongs to a different property (Prime Addis) than what's live now.
- `extensions/features.js` holds custom feature backend code (blog CRUD, etc.) loaded at runtime.

## Running the app
- Workflow **Start application** runs `NODE_ENV=production node dist/dist/index.js` on port 5000.
- Requires `npm install` for `node_modules` (already installed).
- Requires the `DATABASE_URL` secret to point at the real production Neon database.

## Database — CRITICAL
- Uses an external **Neon** Postgres database, not Replit's built-in database. The correct host is `ep-delicate-term-aecpdauf-pooler.c-2.us-east-2.aws.neon.tech`.
- **Never** let Replit auto-provision/attach its own Postgres database for this project — always verify `DATABASE_URL`'s host matches the Neon host above before running any DB operation.
- The database already holds real production data (as of setup: 64 properties, 6 users, 13 tables). **Never** drop/recreate the schema or reseed it.
- **Security issue (known, unresolved):** on every server startup the app resets the default admin account to a weak, hardcoded credential (visible in server startup logs). This is a real bootstrap-time write against the production database — starting the server is not a read-only action for the admin account. Needs a proper fix (e.g. only seed the admin account if none exists, and require an env-provided password) before this is safe to leave running unattended.

## Known in-progress / recent work (do not rebuild)
- Map + price range widget (`subcities-map-patch.js`)
- "Ask AI" (Gemini) chat panel with polished UI, admin prompt editor, bottom-left launcher button
- Lead capture (`visitor-subscribe-patch.js`, `admin-subscribers-patch.js`)
- Blog: public `/blog` + `/blog/:slug`, admin "Manage Blog" UI, backend CRUD in `extensions/features.js`
- Tawk.to widget is hidden via CSS but still runs in the background (not removed)
- Homepage search widget redesign was requested but not yet confirmed applied — last thing in progress before this session

## Secrets configured
- `SESSION_SECRET`
- `DATABASE_URL` (Neon production DB — set as a secret to override Replit's auto-provisioned Postgres, which otherwise silently takes over this env var on fresh imports/checkouts)

## Setup status (as of migration — July 11, 2026)
- `npm install` run, packages in place. Note: on a fresh import `node_modules` is not carried over even though `package-lock.json` is — always run `npm install` before starting the workflow.
- Replit runtime-manages `DATABASE_URL` (points to local `helium` Postgres). Workaround: `start.js` wrapper overrides it with `NEON_DATABASE_URL` secret before launching the app.
- Workflow command: `NODE_ENV=production node start.js` (port 5000).
- Neon DB confirmed connected: `ep-delicate-term-aecpdauf-pooler.c-2.us-east-2.aws.neon.tech` — homepage loads successfully, 64 properties render.
- Note: the `NEON_DATABASE_URL` secret also does not carry over on a fresh import/checkout and must be re-entered by the user each time (re-confirmed working July 11, 2026).
- Known issue: admin password is reset to `admin123` on every boot (see Database section).
- Known cosmetic issue: `ask-ai-bottom-left-button-patch.js` throws a `Cannot read properties of null (reading 'appendChild')` console error on load; pre-existing, does not affect functionality.

## Optional/unused integrations referenced in code
AWS SES, Gmail SMTP, Brevo, Gemini API — currently not configured; email sending logs to console only when unset.
