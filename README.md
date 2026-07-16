# Adevos-X Tech — Real Backend System

This is the complete, working version of the Adevos-X Tech platform: a Node.js/Express
backend, a MongoDB database, and two frontends (the public customer site and the Admin
Panel) that talk to real APIs instead of hardcoded demo data and `localStorage`.

## What changed from the demo

The original `index.html` was a static demo: all content (slides, bots, services, prices)
was hardcoded in JavaScript arrays, and "login", "coins", and "deployed bots" only lived in
the browser's `localStorage`. This version replaces all of that with:

- A **real Express + MongoDB backend** (`backend/`) with models, routes, and middleware for
  every module described in the project docs (auth, content, bot deployment, payments,
  AV Coins, cron jobs, i18n, currency conversion, etc).
- A **public website** (`public/index.html`) that fetches all content from `/api/public/*`,
  logs users in via real Google/GitHub OAuth (JWT-based), and drives the entire bot
  deployment + payment flow through real API calls.
- An **Admin Panel** (`admin/index.html`) with full CRUD over every content type, user
  management, payment verification (manual M-Pesa/Tigo Pesa approval), and global settings.

## Folder structure

```
backend/
  app.js                  # Express entry point — wires DB, routes, static hosting, cron jobs
  seed.js                 # One-time script to populate initial platforms/settings/content
  package.json
  Procfile                 # For Render / Heroku
  .env.example             # Copy to .env and fill in your real values
  config/
    passport.js            # Google + GitHub OAuth strategies
  models/                  # One Mongoose schema per data type (User, Bot, Slide, ...)
  middleware/
    userAuth.js             # JWT check for logged-in users
    adminAuth.js             # JWT check + role:'admin' check
  routes/
    auth.js                  # OAuth flow + admin credential login
    public.js                 # Read-only content APIs for the public site
    admin.js                   # CRUD APIs for the Admin Panel (protected)
    deploy.js                   # Bot deployment flow (start, logs, manage)
    paystack.js                  # Paystack checkout + webhook
    payments.js                   # Manual payment submission + early-renewal pricing
    upload.js                      # Image upload (multer -> Cloudinary), used by Admin
  services/
    dynamicDeploy.js         # Reads DeploymentPlatform from DB, dispatches to the right module
    deployHeroku.js            # Heroku Platform API integration
    deployPanel.js               # Pterodactyl-style panel integration
    assistantService.js           # Keyword-based chatbot (optional OpenAI upgrade)
    cronJobs.js                     # Auto-expiry, email reminders, currency updates
    emailService.js                  # Resend API or SMTP via Nodemailer
    uploadService.js                  # Cloudinary + multer config

public/
  index.html               # Public customer-facing website (fetches everything from the API)

admin/
  index.html               # Admin Panel (login + full CRUD dashboard)
```

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in real values:
   - `MONGO_URI` — your MongoDB Atlas connection string (Free Tier is enough to start).
   - `JWT_SECRET`, `SESSION_SECRET` — any long random strings.
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD` — fallback admin login (no OAuth needed).
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
     — from the Google Cloud Console and GitHub Developer Settings. Set the callback URLs to
     `https://yourdomain.com/auth/google/callback` and `.../auth/github/callback`.
   - `CLOUDINARY_*` — from your Cloudinary dashboard (Free Tier gives 25GB).
   - `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — from your Paystack dashboard. Set the
     webhook URL in Paystack to `https://yourdomain.com/api/paystack/webhook`.
   - `HEROKU_API_KEY`, `PTERODACTYL_PANEL_URL`, `PTERODACTYL_API_KEY` — for the platforms you
     actually plan to deploy bots to.
   - `RESEND_API_KEY` (or `SMTP_*`) — for expiry reminder emails.
   - `EXCHANGE_RATE_API_KEY` — from exchangerate-api.com, for daily currency updates.

3. **Seed initial data** (deployment platforms, default settings, starter services/sidebar)
   ```bash
   node seed.js
   ```

4. **Run the server**
   ```bash
   npm start
   ```
   This one process serves:
   - The API at `/api/...` and `/auth/...`
   - The public website at `/`
   - The Admin Panel at `/admin`

5. **First admin login**: open `/admin` and log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   from your `.env`. From there, use the Admin Panel to add your real Slides, Services,
   Touch Cards, Testimonials, Bots, and Sidebar menu items — the public site starts empty
   except for the seeded services and sidebar, by design, so you control all real content.

   To let a Google/GitHub-authenticated account manage the Admin Panel too, log them in once
   on the public site, then use another admin account (or MongoDB directly) to set their
   `role` to `"admin"` via `PUT /api/admin/users/:id`.

## Deploying to hosting (Render, Heroku, DigitalOcean, Pterodactyl, ...)

This backend is platform-agnostic:
- It reads `PORT` from the environment and has a `Procfile` (`web: node app.js`).
- All secrets come from environment variables — no code changes needed to move hosts.
- To migrate, just set the same `.env` variables in the new platform's dashboard and deploy
  the `backend/` folder (with `public/` and `admin/` alongside it, one level up, as this repo
  is already structured).

## Notes on payments

- **Paystack**: fully automatic. `POST /api/paystack/checkout` creates a checkout link;
  Paystack calls `POST /api/paystack/webhook` on success, which is verified against
  Paystack's API before crediting coins or activating a Deployer subscription.
- **Manual (M-Pesa / Tigo Pesa)**: the user submits `POST /api/payments/manual`, which creates
  a `pending` Transaction. They then send their receipt to your WhatsApp number (configured in
  Admin → Settings → Platform Links). You approve it from Admin Panel → Payments → "Verify and
  Approve", which credits the account automatically.

## Notes on bot deployment

`DeploymentPlatform` records (managed from Admin → Deploy Platforms) map a `slug` (e.g.
`heroku`) to an `.env` variable name holding the API key, and to a deploy module
(`deployHeroku` or `deployPanel`). `services/dynamicDeploy.js` reads this from the database at
deploy time, so adding a new hosting platform is just: add a new `DeploymentPlatform` record
+ write a matching `services/deployX.js` module + register it in `DEPLOY_MODULES` /
`STOP_MODULES` inside `dynamicDeploy.js`.

## Cron jobs (backend/services/cronJobs.js)

- **03:00 daily** — auto-expiry: suspends bots for users whose `deployerExpiry` /
  `subscriptionExpiry` has passed.
- **03:00 daily** — sends expiry reminder emails at 7 days and 1 day before expiry, including
  the early-renewal discount when applicable.
- **06:00 daily** — refreshes currency exchange rates from exchangerate-api.com.
