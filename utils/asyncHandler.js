/**
 * Wraps an async Express route handler so that any rejected promise (thrown error,
 * failed await, etc.) is passed to next(err) instead of becoming an UNHANDLED
 * PROMISE REJECTION.
 *
 * WHY THIS MATTERS: Node.js 15+ terminates the entire process on an unhandled
 * promise rejection by default. Express 4 does NOT automatically catch errors
 * thrown inside async route handlers — a single momentary hiccup (e.g. MongoDB
 * taking a beat to respond, a bad ObjectId, a validation error) in ANY unguarded
 * async route would crash the whole server for EVERY user, not just return an
 * error for that one request. Wrapping every route handler with this function
 * ensures errors become a normal Express error response instead of a crash.
 *
 * Usage:
 *   router.get('/thing', asyncHandler(async (req, res) => {
 *     const doc = await Model.find();
 *     res.json({ success: true, data: doc });
 *   }));
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
