---
name: Replit auto-provisioned DATABASE_URL vs external Neon DB
description: How to tell whether DATABASE_URL is Replit's own built-in Postgres or the project's real external database, and why it matters.
---

Replit can inject its own `DATABASE_URL` automatically (host looks like `helium`/similar internal name) even when a project's actual data lives in an external database (e.g. Neon). `viewEnvVars` will show nothing for `DATABASE_URL` in that case because it's runtime-managed, not a stored secret — so its presence in `process.env` doesn't mean it's the right one.

**Why:** For this project (EthioProperty/Prime Addis), the real production data (properties, users, etc.) lives in an external Neon database. If the app were started against the Replit-injected DATABASE_URL, it would silently point at an empty/wrong database instead of failing loudly.

**How to apply:** Before trusting `DATABASE_URL` in an imported project that mentions an external DB (Neon, Supabase, RDS, etc.), print `new URL(process.env.DATABASE_URL).host` and confirm it matches the expected external host. If it doesn't, request the correct connection string from the user via `requestSecrets({ keys: ["DATABASE_URL"] })` — this overrides the runtime-managed default with the user-provided secret.

**Re-import quirk:** on a fresh GitHub re-import of the same repl, both `node_modules` (despite `package-lock.json` being present) and previously-set secrets (e.g. a project-specific `NEON_DATABASE_URL`) do not carry over. Expect to re-run `npm install` and re-request such secrets even for a project that was already fully set up before.
