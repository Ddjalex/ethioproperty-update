---
name: Headless browser testing without npx
description: How to drive a real headless browser (clicks, navigation, elementFromPoint) in this environment when npx is not on PATH.
---

`npx` is not available in the shell here (`/bin/sh: npx: not found`), so `npx playwright install` fails. Instead:

1. `npm install --no-save playwright-core` in the project root (fast, no browser download).
2. The Nix store already has a prebuilt Chromium for Playwright at a path like
   `/nix/store/<hash>-playwright-browsers-chromium/chromium-<rev>/chrome-linux/chrome`
   (find it with `ls /nix/store | grep -i playwright` then `find <that dir> -maxdepth 3`).
3. Launch with `chromium.launch({ executablePath: <that path>, args: ["--no-sandbox"] })` inside a `"use impure"` CodeExecution block.
4. Use `waitUntil: "load"` for `page.goto`, not `"networkidle"` — apps with polling requests (e.g. periodic `/api/*` calls) never go idle and the goto times out.

This is the reliable way to verify interactive bugs (click handlers, SPA routing, overlay/z-index click theft) that static screenshots can't catch.
</content>
