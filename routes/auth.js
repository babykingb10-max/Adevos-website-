const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();

function signUserToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function signAdminEnvToken(username) {
  return jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

// ---------- GOOGLE ----------
// Pass ?admin=true (as the Admin Panel's login links do) to be redirected back to /admin
// with the token instead of the public site. Note: the account still needs role:'admin'
// in the database for adminAuth middleware to accept the resulting token.
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ success: false, message: 'Google login is not configured yet on this server.' });
  }
  const state = req.query.admin === 'true' ? 'admin' : 'public';
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }),
  (req, res) => {
    const token = signUserToken(req.user);
    const isAdmin = req.query.state === 'admin';
    const redirectBase = isAdmin ? '/admin' : process.env.FRONTEND_SUCCESS_REDIRECT || '/';
    res.redirect(`${redirectBase}?token=${token}`);
  }
);

// ---------- GITHUB ----------
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ success: false, message: 'GitHub login is not configured yet on this server.' });
  }
  const state = req.query.admin === 'true' ? 'admin' : 'public';
  passport.authenticate('github', { scope: ['user:email'], session: false, state })(req, res, next);
});

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login-failed' }),
  (req, res) => {
    const token = signUserToken(req.user);
    const isAdmin = req.query.state === 'admin';
    const redirectBase = isAdmin ? '/admin' : process.env.FRONTEND_SUCCESS_REDIRECT || '/';
    res.redirect(`${redirectBase}?token=${token}`);
  }
);

// ---------- ADMIN CREDENTIAL LOGIN (username/password from .env) ----------
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = signAdminEnvToken(username);
    return res.json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
});

// ---------- LOGIN FAILURE ----------
router.get('/login-failed', (req, res) => {
  res.status(401).json({ success: false, message: 'OAuth login failed' });
});

module.exports = router;
