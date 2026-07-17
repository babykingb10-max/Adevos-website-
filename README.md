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

## What's new: default content, admin toggles, and full skill-doc coverage

This update makes the public site launch with real default content (matching the original
demo) instead of an empty page, and moves several previously-hardcoded things into
Admin → Settings so they're fully controllable without touching code:

- **`node seed.js` now seeds everything**: all 4 homepage slides, all 8 "Get in touch" touch
  cards, the full hamburger sidebar menu (every group from the original demo), starter
  testimonials, an update-log entry, and 2 sample bots. Every one of these is a normal
  database record — delete it, edit it, or replace it from the Admin Panel any time.
- **"Get a Free Bot" button** (Deploy modal) is now driven by `Settings.freeBot` —
  `enabled` (on/off) and `whatsappLink`. It starts **off** (no link set) until you configure
  it from Admin → Settings, so the button never points at a broken link. Toggle it on/off
  freely afterwards.
- **Manual payment (M-Pesa/Tigo Pesa)** is now driven by `Settings.manualPayment` —
  `enabled` (on/off), `instructions` text, and a list of `{ label, number }` payment
  destinations. Starts **on** with placeholder numbers; replace them with your real ones from
  Admin → Settings. Turning it off immediately hides the "Manually" button on the public site.
- **"Stay Connected" social icons** are now driven by `Settings.socialLinks`. Every field
  starts **empty**, and the public site only renders an icon for a platform once you've filled
  in its link from Admin → Settings — no more dead `#` links.
- **AV Coins economics** (`coinsRequiredPerDeploy`, `coinsPerReferral`) were already
  admin-editable; the public site now actually reads and displays these live numbers instead
  of the hardcoded "50" that was baked into the HTML before.
- **`layout` field (top/bottom/left/right)** on Slides and Touch Cards is now actually applied
  on the public site (previously stored in the database but ignored by the frontend) — `left`/
  `right` renders the touch card as an image-beside-text panel; `top`/`bottom` controls stacking
  order, exactly as described in the original spec.
- **Multi-language (i18n)**: a small language switcher (EN/SW/FR) now lives in the profile
  settings popup next to the theme switcher. A handful of section headers are tagged
  `data-i18n` and pull live translations from `/api/public/translations`; seeded with English,
  Swahili, and French out of the box. Add more keys/languages from Admin → Translations, then
  tag any element you want translated with `data-i18n="your_key"`.
- **Currency conversion** is now visibly wired in: the Deploy modal's Paystack panel and the
  Deployer Account price tag show the real price from `Settings` plus a currency-converted
  approximation (e.g. `$5 USD (≈ TSh 12,500)`) based on the visitor's detected country —
  previously this data existed in the database but was never shown anywhere.
- **PWA support**: `public/manifest.json` + `public/sw.js` (a service worker that caches the
  app shell but always fetches live API data fresh) + generated icons in `public/icons/` are
  now included and registered, so mobile browsers offer "Add to Home Screen" as described in
  the original docs.
- **Favicon**: `favicon.ico`, `favicon-32x32.png`, and `favicon-16x16.png` are included and
  linked from both the public site and the Admin Panel `<head>`.
- **Fixed a real bug**: `config/passport.js` used to construct the Google/GitHub OAuth
  strategies unconditionally, which throws and crashes the *entire server* at boot if those
  credentials aren't set yet. Both strategies are now registered only when their credentials
  are present — everything else keeps working normally in the meantime.



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

## How AV Coins works, end to end

1. Every logged-in user can generate a unique referral code (`POST /api/public/referral/generate`
   — the public site calls this from the AV Coins page). It looks like `REF-AB12CD`.
2. They share their link: `https://yoursite.com/?ref=REF-AB12CD`.
3. When someone new opens that link and logs in, the frontend automatically calls
   `POST /api/public/referral/claim` with that code. The backend credits the **referrer**
   with `coinsPerReferral` coins (default 2, editable in Admin → Settings) — not the new
   signup. Each account can only claim one referral code, once, and can't refer itself.
4. To spend coins: in the Deploy Bot modal, a user picks "Coins" as the payment method. The
   backend checks `user.coins >= coinsRequiredPerDeploy` (default 50, editable in Admin →
   Settings) at the moment they hit Deploy, deducts them, and the deployment proceeds — no
   Paystack or manual payment needed.
5. Admin can view or manually adjust any user's coin balance from Admin → Users → "Adjust Coins"
   (useful for support cases, promotions, or correcting a mistake).

## How manual payment works, end to end (on by default)

1. `Settings.manualPayment.enabled` is `true` out of the box (with 2 placeholder numbers from
   `seed.js`) — go to Admin → Settings and replace them with your real M-Pesa/Tigo Pesa/bank
   numbers before going live.
2. On the public site, a customer picks "Manually" in the Deploy modal (or Deployer Account
   modal), sees your instructions + numbers, sends the money outside the app, then clicks
   "I've Sent Payment — Submit for Verification". This calls `POST /api/payments/manual` and
   creates a `Transaction` with `status: 'pending'` — nothing is credited yet.
3. The customer sends their payment screenshot/receipt to your WhatsApp number (set that number
   in Admin → Settings → Platform Links, and/or in your manual payment instructions text).
4. You open Admin Panel → Payments, find the pending transaction, compare it against the
   receipt they sent you, and click **"Verify and Approve"**. This is the only step that
   actually credits the account — it adds AV Coins or activates/extends the Deployer
   subscription automatically, and marks the transaction `completed`.
5. If a receipt looks fake or the payment never arrived, click **"Reject"** instead — nothing
   is credited and the transaction is marked `failed`.
6. To stop accepting manual payments entirely (e.g. if you only want Paystack going forward),
   flip `Settings.manualPayment.enabled` to **No** in Admin → Settings — the "Manually" button
   disappears from the public site immediately, without any code changes or redeploy.

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
