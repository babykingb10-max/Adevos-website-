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

The whole backend lives at the **project root** (not in a subfolder) so it deploys on
Heroku/Render with zero extra configuration — those platforms look for `package.json` and
the `Procfile` at the repo root by default.

```
app.js                  # Express entry point — wires DB, routes, static hosting, cron jobs
seed.js                 # One-time script to populate initial platforms/settings/content
package.json
Procfile                 # For Render / Heroku  (web: node app.js)
.env.example              # Copy to .env and fill in your real values
config/
  passport.js              # Google + GitHub OAuth strategies (auto-disabled if not configured)
models/                    # One Mongoose schema per data type (User, Bot, Slide, ...)
middleware/
  userAuth.js               # JWT check for logged-in users
  adminAuth.js                # JWT check + role:'admin' check
routes/
  auth.js                      # OAuth flow + admin credential login
  public.js                     # Read-only content APIs for the public site
  admin.js                       # CRUD APIs for the Admin Panel (protected)
  deploy.js                       # Bot deployment flow (start, logs, manage)
  paystack.js                      # Paystack checkout + webhook
  payments.js                       # Manual payment submission + early-renewal pricing
  upload.js                          # Image upload (multer -> Cloudinary), used by Admin
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
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in real values (see "Minimum variables to boot" below for what's actually required
   just to get the server running, versus what each feature needs).

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

## Minimum variables to boot

The server will **refuse to start at all** without a working `MONGO_URI` — `app.js` connects
to MongoDB on boot and calls `process.exit(1)` if that connection fails, since almost every
route depends on the database.

Beyond that, here's what's required for the server process itself to stay up versus what's
only needed for a specific feature to work:

| Variable | Needed just to boot? | What breaks without it |
|---|---|---|
| `MONGO_URI` | **Yes — hard requirement** | Server won't start at all |
| `JWT_SECRET` | No (server starts fine) | Login (`/auth/admin/login`, OAuth) fails at the moment someone tries to sign in |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | No | Just means no one can log into `/admin` via credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No — auto-skipped if missing | `/auth/google` returns a clean "not configured" message instead of working; rest of the site is unaffected |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | No — auto-skipped if missing | Same as above, for `/auth/github` |
| `CLOUDINARY_*` | No | Image upload in Admin fails; everything else works |
| `PAYSTACK_SECRET_KEY` | No | Paystack checkout/webhook fail; manual payments and coins still work |
| `HEROKU_API_KEY` / `PTERODACTYL_*` | No | Deploying a bot on that specific platform fails; site still loads |
| `RESEND_API_KEY` / `SMTP_*` | No | Expiry reminder emails are skipped (logged as a warning) |
| `EXCHANGE_RATE_API_KEY` | No | Currency conversion cron job skips itself |

**So the honest answer for a first Heroku smoke test:** setting `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, and `JWT_SECRET` alone is **not enough** — the site won't open at all
without `MONGO_URI` too. Once `MONGO_URI` is added, the homepage will load and admin
credential login will work; every other feature (OAuth, payments, uploads, deployments,
emails) simply stays gracefully disabled/logs a warning until its own variables are added.

## Deploying to hosting (Render, Heroku, DigitalOcean, Pterodactyl, ...)

This backend is platform-agnostic and Heroku-ready out of the box:
- `package.json` and `Procfile` (`web: node app.js`) sit at the **repo root**, which is what
  Heroku's Node buildpack expects — no monorepo buildpack or subdirectory config needed.
- It reads `PORT` from the environment automatically.
- All secrets come from environment variables — no code changes needed to move hosts.
- To deploy: push this whole folder as a Git repo, `heroku config:set` your `.env` values
  (see "Minimum variables to boot" above for what's required vs optional), then
  `git push heroku main`. Run `heroku run node seed.js` once after the first deploy.
- To migrate to Render/DigitalOcean/Pterodactyl later, just set the same environment
  variables in the new platform's dashboard — the code doesn't change.

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
