---
name: dotenv vs Replit-managed env vars
description: Why dotenv.config() can silently ignore a project's .env file, and how it interacts with Replit-managed keys like DATABASE_URL.
---

`dotenv.config()` (no options) only fills in variables that are NOT already
present in `process.env`. It never overwrites an existing value.

Replit injects some keys into `process.env` before the app process even
starts (e.g. `DATABASE_URL`, `PGHOST`, etc. — see the "runtime-managed keys"
list in the environment-secrets skill). If a project also ships a checked-in
`.env` file with its own `DATABASE_URL`, calling plain `dotenv.config()` will
NOT let that .env value take effect, because Replit's placeholder is already
set first — the app silently keeps using the placeholder/wrong database.

**Why:** This caused real confusion once — logs showed a plausible-looking
Neon hostname either way, but which actual database was live depended on
whether `override: true` was passed, and whether the user had also added a
`DATABASE_URL` Replit Secret (which also lands in `process.env` before
dotenv runs).

**How to apply:**
- If the intended source of truth is a Replit Secret, leave `dotenv.config()`
  as the default (no override) — the secret already in `process.env` wins.
- If the intended source of truth is the checked-in `.env` file (no relevant
  secret set), use `dotenv.config({ override: true })`.
- When debugging "wrong database" symptoms, log only the host (`new
  URL(process.env.DATABASE_URL).host`), never the full connection string,
  and verify it against both the `.env` file and any Replit Secret of the
  same name before assuming which one is active.
