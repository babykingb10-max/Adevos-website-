const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects all /api/admin/* routes.
// Checks the Authorization header for a valid JWT that carries role: 'admin'.
module.exports = async function adminAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: admin token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized: admin role required' });
    }

    // For DB-backed admins (logged in via Google/GitHub OAuth and promoted to admin),
    // re-check the role in the database in case it was revoked.
    if (decoded.id) {
      const user = await User.findById(decoded.id);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ success: false, message: 'Unauthorized: admin role revoked' });
      }
      req.admin = user;
    } else {
      // Env-credential admin (ADMIN_USERNAME / ADMIN_PASSWORD login) has no DB record.
      req.admin = { username: decoded.username, role: 'admin' };
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid or expired admin token' });
  }
};
