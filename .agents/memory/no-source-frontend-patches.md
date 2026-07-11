---
name: Fixing frontend bugs when only a compiled bundle exists (no client/ source)
description: How UI fixes are made in the EthioProperty/Prime Addis imported project, which ships only a built dist/dist/public bundle plus small vanilla-JS "patch" scripts — no React source.
---

This project (EthioProperty / Prime Addis) has no live `client/`/`server/` source in the repo — only the pre-built bundle at `dist/dist/public` (minified `index-*.js`) plus a set of small vanilla-JS files in `dist/dist/public/assets/*-patch.js`, loaded via `<script>` tags in `dist/dist/public/index.html` after the main bundle.

**Why:** The minified React bundle can't be edited directly (no source, no sourcemaps to rebuild from), so the established convention in this codebase is to fix/extend behavior with additional small DOM-patching scripts rather than touching the bundle.

**How to apply:** For a UI bug fix or tweak, write or edit a `*-patch.js` file (self-guarding with a `window.__paXxxV1__` flag, MutationObserver + `history.pushState`/`popstate` hooks to survive SPA navigation) and register it in `index.html`. Bump the `?v=` query string on the `<script src>` when editing an existing patch file so browsers don't serve a stale cached copy. Read the minified bundle with targeted `grep`/`node -e` snippets to find exact hardcoded strings/selectors before writing a patch — don't guess at markup.
