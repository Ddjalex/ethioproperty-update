---
name: Service account private key corrupted by pasted wrapping quotes
description: A JWT/service-account private key secret that fails OpenSSL decoding despite looking like valid PEM — check for stray quote/whitespace characters from JSON-file copy-paste.
---

## The pattern
When a user copies a `private_key` value out of a downloaded Google (or similar) service-account JSON file and pastes it into a secret field, it's easy to accidentally include the surrounding JSON string quotes and/or a leading/trailing space (e.g. from selecting ` "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` including the outer `"..."`). This produces an error like `error:1E08010C:DECODER routines::unsupported` when the PEM is parsed — a generic, unhelpful message that gives no hint the actual problem is one stray leading space and a trailing literal `"`.

**Why:** the wrapping quotes and stray whitespace aren't visible when eyeballing a value, and standard "convert literal \n to real newlines" sanitization doesn't catch this case, so the fix looks unrelated to the visible symptom.

**How to apply:** when a service-account/JWT key fails to parse, sanitize by trimming and stripping a matching pair of leading/trailing `"` or `'` (after trim) *before* converting escaped `\n` to real newlines. Applied in EthioProperty's `buildSheetsAuth()` (`extensions/features.js`) for `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`/`_EMAIL`. Diagnose by running the raw env var through a Node script that prints `JSON.stringify(key.slice(0,40))` and `.slice(-40)` — a stray quote or space at the boundary is immediately visible that way, whereas Google's own error (`invalid_grant`/`account not found` or `unsupported` decode) will not tell you.
