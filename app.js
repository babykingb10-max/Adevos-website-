require('dotenv').config();

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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('[db] Connected to MongoDB Atlas');
    initCronJobs();
  })
  .catch((err) => {
    console.error('[db] Connection error:', err.message);
    process.exit(1);
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
