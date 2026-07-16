const mongoose = require('mongoose');

const DeploymentPlatformSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Heroku"
    slug: { type: String, required: true, unique: true }, // e.g. "heroku"
    envKey: { type: String, required: true }, // e.g. "HEROKU_API_KEY" - name of the env var holding the API key
    moduleName: { type: String, required: true }, // e.g. "deployHeroku" -> maps to services/deployHeroku.js
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeploymentPlatform', DeploymentPlatformSchema);
