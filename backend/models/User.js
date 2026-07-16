const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    provider: { type: String, enum: ['google', 'github', 'local'], default: 'local' },
    providerId: { type: String },
    passwordHash: { type: String }, // only used for local/admin credential login
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // AV Coins
    coins: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // Deployer / subscription
    isDeployer: { type: Boolean, default: false },
    deployerExpiry: { type: Date, default: null },
    subscriptionExpiry: { type: Date, default: null },

    // Reminder tracking so we don't email the same person twice for the same expiry window
    lastReminderSentDays: { type: Number, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
