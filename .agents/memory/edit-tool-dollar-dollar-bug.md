---
name: Edit tool eats literal $$ in new_string
description: SQL placeholder templates like `ILIKE $${n}` lose one $ when written via the Edit tool's new_string.
---

When a `new_string` passed to the file-edit tool contains a literal `$$` immediately followed by `{...}` (e.g. building a Postgres placeholder inside a JS template literal: `` `ILIKE $${params.length}` ``), the tool can silently collapse it to a single `$`, producing `` `ILIKE ${params.length}` `` — which JS then evaluates as pure interpolation with no literal dollar sign at all. The resulting SQL becomes `ILIKE 2` instead of `ILIKE $2`, which Postgres rejects with `operator does not exist: text ~~* integer` (or just silently misbehaves for other operators).

**Why:** Likely an internal `String.replace`-style substitution where `$$` in the replacement string is a regex-replacement escape for a literal `$`, eating one of the two dollars that were supposed to survive.

**How to apply:** After any Edit tool call whose new_string contains `$$`, immediately grep the file for the exact expected pattern (e.g. `grep -n 'ILIKE \$\$'`) before moving on — don't assume the edit landed as written. If it's missing, don't retry the same Edit call (it will fail the same way); instead fix it with a small Node/JS script that does plain string concatenation (`'$' + '${expr}'`) rather than a template literal containing `$$`, or write the whole file/section via WriteFile.
