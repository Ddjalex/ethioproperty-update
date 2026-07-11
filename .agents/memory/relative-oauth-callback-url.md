---
name: Relative OAuth callback URLs work across multiple domains
description: How passport-oauth2-based strategies (Google, etc.) resolve a callbackURL that isn't a full https:// string.
---

`passport-google-oauth20` (built on `passport-oauth2`) accepts a relative `callbackURL` (e.g. `/auth/google/callback`). It resolves the final redirect URI at request time using the incoming request's protocol + `Host` header, not a hardcoded value.

**Why:** This lets one Strategy config work correctly on multiple domains (e.g. a production custom domain and a Replit dev/preview domain) as long as each exact `<host>/callback-path>` combination is separately registered as an authorized redirect URI in the OAuth provider's console. No per-environment `GOOGLE_CALLBACK_URL` env var or code branching needed.

**How to apply:** When wiring OAuth login on a project that runs under more than one hostname (custom domain + Replit preview/dev domain), just use a relative `callbackURL` and register both exact host+path combos with the provider. Verify with `curl -sI https://<host>/auth/provider | grep -i location` — the `redirect_uri` query param in the 302 must exactly match a registered URI. Also ensure `app.set('trust proxy', 1)` is set so `req.protocol`/`req.get('host')` reflect the real external host behind Replit's proxy.
