- [dotenv vs Replit-managed env vars](dotenv-vs-replit-secrets.md) — dotenv.config() never overrides an already-set process.env var; matters for DATABASE_URL and other runtime-managed keys.
- [npm package-firewall CVE blocks](npm-firewall-overrides.md) — fix blocked transitive deps (e.g. form-data, fast-xml-parser) via package.json "overrides" to a patched version, not by bypassing the firewall.
- [Replit auto-DB vs external Neon DB](replit-auto-db-vs-external-neon.md) — verify DATABASE_URL host before trusting it; Replit can silently inject its own DB even when the real data lives elsewhere.
- [High z-index popups silently eat clicks](high-zindex-popup-click-theft.md) — a full-screen modal/backdrop with near-max z-index steals clicks from anything visually underneath it, even overlapping unrelated buttons; symptom looks like "button does nothing."
- [Headless browser testing without npx](headless-browser-testing-without-npx.md) — npx is unavailable in this shell; use npm install playwright-core + the nix store's prebuilt chromium binary to drive real click/navigation tests.
- [No-source frontend patches](no-source-frontend-patches.md) — EthioProperty/Prime Addis ships only a compiled bundle; fix UI bugs via small vanilla-JS patch scripts registered in index.html, not by editing the minified bundle.
- [Relative OAuth callback URLs](relative-oauth-callback-url.md) — passport-oauth2 strategies resolve a relative callbackURL from the request's host, so one config works across multiple domains if each is registered with the provider.
- [Detached-element outside-click bug](detached-target-outside-click-bug.md) — self-removing children (chips/dismiss buttons) make `contains(e.target)` outside-click checks misfire; use `composedPath()` instead.
- [Real-time voice startup latency](realtime-voice-latency-buffering.md) — don't gate getUserMedia() behind the server handshake; start mic capture in parallel and buffer until 'ready'.
</content>
