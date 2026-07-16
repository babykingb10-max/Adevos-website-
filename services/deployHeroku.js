const axios = require('axios');

/**
 * Deploys a bot to Heroku using the Heroku Platform API.
 * This creates a new Heroku app, sets its config vars (owner name/number/session id, etc.),
 * and triggers a build from the bot's GitHub repository.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Heroku API key (read from process.env via the platform's envKey)
 * @param {Object} params.bot - Bot document (name, githubRepo, ...)
 * @param {Object} params.owner - { ownerName, ownerNumber, sessionId }
 * @param {Function} params.onLog - callback(text) to stream a log line back to the deployment record
 * @returns {Promise<{ externalAppId: string }>}
 */
async function deployToHeroku({ apiKey, bot, owner, onLog }) {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.heroku+json; version=3',
    'Content-Type': 'application/json'
  };

  onLog('Connecting to Heroku API...');

  const appName = `adevosx-${bot.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()
    .toString()
    .slice(-6)}`;

  const createRes = await axios.post(
    'https://api.heroku.com/apps',
    { name: appName, region: 'us' },
    { headers }
  );
  const appId = createRes.data.id;

  onLog(`Heroku app "${appName}" created. Setting config vars...`);

  await axios.patch(
    `https://api.heroku.com/apps/${appName}/config-vars`,
    {
      OWNER_NAME: owner.ownerName,
      OWNER_NUMBER: owner.ownerNumber,
      SESSION_ID: owner.sessionId
    },
    { headers }
  );

  onLog('Triggering build from GitHub repository...');

  await axios.post(
    `https://api.heroku.com/apps/${appName}/builds`,
    { source_blob: { url: `${bot.githubRepo}/tarball/main` } },
    { headers }
  );

  onLog('Heroku build triggered. Bot will be online shortly.');

  return { externalAppId: appName };
}

/**
 * Stops/suspends a Heroku app - used by the auto-expiry cron job.
 */
async function stopHerokuApp({ apiKey, externalAppId }) {
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.heroku+json; version=3' };
  // Scaling web dynos to 0 is the standard way to "stop" a Heroku app without deleting it.
  await axios.patch(
    `https://api.heroku.com/apps/${externalAppId}/formation`,
    { updates: [{ type: 'web', quantity: 0 }] },
    { headers }
  );
}

module.exports = { deployToHeroku, stopHerokuApp };
