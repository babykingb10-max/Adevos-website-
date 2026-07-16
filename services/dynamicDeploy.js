const DeploymentPlatform = require('../models/DeploymentPlatform');
const { deployToHeroku, stopHerokuApp } = require('./deployHeroku');
const { deployToPanel, suspendPanelServer } = require('./deployPanel');

// Maps a platform's `moduleName` field to the actual deploy function.
const DEPLOY_MODULES = {
  deployHeroku: deployToHeroku,
  deployPanel: deployToPanel
};

const STOP_MODULES = {
  deployHeroku: stopHerokuApp,
  deployPanel: suspendPanelServer
};

/**
 * Looks up the requested platform by slug, checks it is active, reads its API key
 * from process.env using the platform's envKey, and calls the matching deploy module.
 *
 * @param {string} platformSlug - e.g. "heroku"
 * @param {Object} bot - Bot document
 * @param {Object} owner - { ownerName, ownerNumber, sessionId }
 * @param {Function} onLog - streams log lines back to the caller
 */
async function dynamicDeploy(platformSlug, bot, owner, onLog) {
  const platform = await DeploymentPlatform.findOne({ slug: platformSlug });

  if (!platform) {
    throw new Error(`Unknown deployment platform: ${platformSlug}`);
  }
  if (!platform.isActive) {
    throw new Error(`Deployment platform "${platform.name}" is currently disabled`);
  }

  const apiKey = process.env[platform.envKey];
  if (!apiKey) {
    throw new Error(`Missing API key for platform "${platform.name}" (expected env var ${platform.envKey})`);
  }

  const deployFn = DEPLOY_MODULES[platform.moduleName];
  if (!deployFn) {
    throw new Error(`No deployment module registered for "${platform.moduleName}"`);
  }

  const result = await deployFn({ apiKey, bot, owner, onLog });
  return { platform, ...result };
}

/**
 * Stops/suspends a bot on its platform - used by the auto-expiry cron job.
 */
async function dynamicStop(platformSlug, externalAppId) {
  const platform = await DeploymentPlatform.findOne({ slug: platformSlug });
  if (!platform) return;

  const apiKey = process.env[platform.envKey];
  if (!apiKey) return;

  const stopFn = STOP_MODULES[platform.moduleName];
  if (!stopFn) return;

  await stopFn({ apiKey, externalAppId });
}

module.exports = { dynamicDeploy, dynamicStop };
