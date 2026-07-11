# Google Sign-In + Google Sheets Lead Sync

## Prerequisites (confirm before starting)
These Secrets must already exist: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY. If any are missing, stop and tell me — do not invent placeholder values.

## Part 1 — Google Sign-In
1. Check the existing auth system (users table, password_reset_tokens, any Passport.js setup already in extensions/features.js or the compiled bundle) to see what pattern is already used for login/sessions.
2. Add Google OAuth as an additional login method using GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — implement via passport-google-oauth20 (or an equivalent lightweight OAuth flow if Passport isn't already present).
3. Add a route like /auth/google (start OAuth) and /auth/google/callback (handle response) in extensions/features.js.
4. On successful Google login: if a user with that email already exists in the users table, log them in; if not, create a new user record (using their Google name/email), matching whatever fields the existing users table already has.
5. Wire the existing "Continue with Google" button in the sign-in modal to actually call /auth/google instead of being a static/non-functional button.

## Part 2 — Sync new signups/leads to Google Sheets
1. Install the googleapis npm package if not already present.
2. Write a small helper function that authenticates using GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (JWT auth, not OAuth — this is a server-to-server credential) and appends a row to the Sheet at GOOGLE_SHEETS_ID.
3. Call this helper in two places:
   a. Whenever a new user signs up (via Google Sign-In OR the existing email/password signup) — append a row with name, email, signup method (google/email), timestamp
   b. Whenever a new subscriber/lead is captured via the existing visitor-subscribe-patch.js flow (the /api/subscribe route) — append a row with name, phone, email, timestamp
4. Make this fire-and-forget / non-blocking — if the Sheets API call fails (network issue, bad credentials), it should log the error but NOT block or break the actual signup/subscribe flow for the visitor.

## Testing
1. Click "Continue with Google" on the site, complete a real Google login, confirm you're logged in and a new row appears in the Sheet
2. Submit the lead-capture popup (name/phone/email) as a test, confirm a row appears in the Sheet
3. Confirm the private key env var was read correctly (a common gotcha: the key contains literal `\n` characters that sometimes need `.replace(/\\n/g, '\n')` when read from an env var — check for this if auth fails)

Report back once both flows are confirmed working, including a screenshot-style description of what the Sheet rows look like.
