const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Generates a short, unique referral code for a new user, e.g. "REF-AB12CD"
function generateReferralCode() {
  return 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function findOrCreateUser({ provider, providerId, name, email, avatarUrl }) {
  let user = await User.findOne({ provider, providerId });
  if (user) return user;

  // Fall back to matching by email in case the same person used a different provider before
  user = await User.findOne({ email });
  if (user) return user;

  user = await User.create({
    name,
    email,
    provider,
    providerId,
    avatarUrl,
    referralCode: generateReferralCode()
  });
  return user;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser({
          provider: 'google',
          providerId: profile.id,
          name: profile.displayName || 'Google User',
          email: profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.id}@google.oauth`,
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser({
          provider: 'github',
          providerId: profile.id,
          name: profile.displayName || profile.username || 'GitHub User',
          email:
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : `${profile.username}@github.oauth`,
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : ''
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Not using persistent sessions (we issue JWTs instead), but Passport requires these.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
