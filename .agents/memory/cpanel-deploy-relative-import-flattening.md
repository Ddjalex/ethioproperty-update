---
name: cPanel deploy zip relative-import flattening
description: Why flattening a nested dist/dist build output for cPanel deploy zips breaks baked-in relative import paths in the compiled bundle.
---

When packaging a Replit build's `dist/dist/index.js` (nested build output) into a flat
`dist/index.js` for a cPanel deploy zip, any relative dynamic import inside the bundle
(e.g. `import('../../extensions/features.js')`) was compiled assuming the *nested* path
depth. Flattening the file up one directory shifts every `../`-style import by one level,
so it silently escapes the app root (e.g. resolves to `public_html/extensions/...` instead
of `public_html/ethioproperty/extensions/...`).

**Why:** the user's `.htaccess`/cPanel Node.js App config expects a flat `dist/index.js`
(`PassengerStartupFile dist/index.js`), not the nested `dist/dist/index.js` Replit's build
produces — so flattening is required, but the bundle's relative imports must be corrected
to match (drop one `../` per import) rather than assuming the copy is a no-op.

**How to apply:** before shipping a cPanel deploy zip built from this repo, grep the
flattened `dist/index.js` for `\.\./[a-zA-Z./]*` to catch every relative import/require, and
verify each still resolves correctly from the new flat depth. Only fix the ones actually
reached in production (e.g. dev-only `setupVite`/`../vite.config` imports guarded by
`NODE_ENV !== 'development'` don't matter).
