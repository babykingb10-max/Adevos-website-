const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bot: { type: mongoose.Schema.Types.ObjectId, ref: 'Bot', required: true },
    ownerName: { type: String, required: true },
    ownerNumber: { type: String, required: true },
    sessionId: { type: String, required: true },
    platform: { type: mongoose.Schema.Types.ObjectId, ref: 'DeploymentPlatform', required: true },
    status: {
      type: String,
      enum: ['pending', 'deploying', 'online', 'stopped', 'failed', 'suspended'],
      default: 'pending'
    },
    logs: [{ text: String, at: { type: Date, default: Date.now } }],
    externalAppId: { type: String, default: '' }, // ID/name of the app on the hosting platform
    isActive: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deployment', DeploymentSchema);
