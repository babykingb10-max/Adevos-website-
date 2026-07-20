require('dotenv').config();

// ---------------------------------------------------------------------------
// Last-resort safety nets. Every route handler in this app is wrapped with
// utils/asyncHandler.js, which is the PRIMARY fix for the crash bug where a
// single database hiccup on any request used to bring down the entire server
// for every user. These process-level handlers are a defensive backstop for
// anything outside a request handler (e.g. a bug in a third-party library) —
// they log the error clearly instead of letting Node silently terminate the
// process, since Node 15+ crashes on unhandled promise rejections by default.
// ---------------------------------------------------------------------------
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] This should not happen — please report it. Reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] This should not happen — please report it. Error:', err);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport');
const { initCronJobs } = require('./services/cronJobs');

const app = express();

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(morgan('dev'));

// NOTE: the Paystack webhook route needs the raw request body for signature
// verification, so it defines its own express.json({ verify }) internally.
// Everything else can safely use the standard JSON parser.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/paystack/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'adevosx-session-secret',
    resave: false,
    saveUninitialized: false
  })
);
app.use(passport.initialize());

// ---------------------------------------------------------------------------
// Database connection (MongoDB Atlas)
// ---------------------------------------------------------------------------
// Only the initial connection failure is fatal (process.exit) — a missing or
// invalid MONGO_URI means the app fundamentally cannot function, so it's
// better to fail fast and loudly here. Once connected, Mongoose's own driver
// handles brief network blips/reconnects automatically (queries buffer and
// retry rather than throwing), and every route is also wrapped in
// asyncHandler so any residual DB error becomes a normal error response
// instead of crashing the process.
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[db] Connected to MongoDB Atlas');
    initCronJobs();
  })
  .catch((err) => {
    console.error('[db] Initial connection failed — check MONGO_URI:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('[db] Connection error (server stays up, Mongoose will retry):', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('[db] Disconnected from MongoDB — Mongoose will attempt to reconnect automatically.');
});
mongoose.connection.on('reconnected', () => {
  console.log('[db] Reconnected to MongoDB.');
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/auth', require('./routes/auth'));
app.use('/api/public', require('./routes/public'));
app.use('/api/admin/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/deploy')); // exposes /api/deploy, /api/deploy/logs/:id, ...
app.use('/api/paystack', require('./routes/paystack'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));

// ---------------------------------------------------------------------------
// Static hosting: Public website + Admin website
// (This lets the whole system — API, public site, admin panel — run from one
// process/one host. Serves public/ at "/" and admin/ at "/admin".)
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------------------------------------------------------------------------
// Error handler (fallback)
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] Adevos-X backend running on port ${PORT}`));
