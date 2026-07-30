# EthioProperty / Prime Addis

A real estate listing platform for properties in Addis Ababa and Ethiopia. Fullstack app built with React (frontend) and Express (backend), served as a pre-compiled bundle.

## Stack
- **Frontend**: React 18, Tailwind CSS, Radix UI, Wouter, TanStack Query
- **Backend**: Express, Drizzle ORM, PostgreSQL (Neon)
- **Auth**: Passport.js (local + Google OAuth optional)
- **AI**: Gemini Live (voice-to-voice)
- **Payments**: Stripe
- **Email**: AWS SES (optional)

## Running the app
The workflow `Start application` runs: `NODE_ENV=production node start.js`

`start.js` sets `DATABASE_URL` from `NEON_DATABASE_URL`, then launches `dist/dist/index.js` on port 5000.

## Required secrets
- `NEON_DATABASE_URL` — Neon PostgreSQL connection string
- `SESSION_SECRET` — Express session secret

## Optional secrets (features disabled if absent)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `GEMINI_API_KEY` — AI voice assistant
- `STRIPE_SECRET_KEY` — Payments
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `EMAIL_FROM` — Email via SES

## Project structure
- `dist/dist/index.js` — compiled server bundle (ESM)
- `dist/public/` — compiled frontend assets
- `extensions/` — feature extensions loaded at runtime (`features.js`, `gemini-ai.js`)
- `uploads/` — user-uploaded property images
- `start.js` — entrypoint that wires NEON_DATABASE_URL then spawns the server

## User preferences
<!-- Add user preferences here as they are confirmed -->
