---
name: npm package-firewall CVE blocks
description: How to resolve Replit's package-firewall 403 blocks on transitive dependencies with a known CVE.
---

`npm install` can fail with `403 Forbidden ... Blocked by Security Policy`
for a transitive dependency pinned to a version with a critical CVE (seen
with `form-data@4.0.2` and `fast-xml-parser@4.4.1`, pulled in transitively
by unrelated direct deps like AWS SDK packages).

**Why:** The Replit package firewall blocks known-vulnerable versions
outright; npm's own dependency resolution had pinned an old vulnerable
version of a shared transitive dep.

**How to apply:** Add a `"overrides"` block to `package.json` forcing the
transitive dependency to a patched version in the same major line (e.g.
`fast-xml-parser: "^4.5.7"` instead of jumping to `5.x`, to avoid breaking
the parent package's API expectations), then retry the install. Check
`npm view <pkg> versions --json` to find the nearest patched version before
choosing one.
