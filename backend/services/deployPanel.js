const axios = require('axios');

/**
 * Deploys a bot to a Pterodactyl-style panel using its Application/Client API.
 * Creates a new server for the bot with the owner's info baked in as environment variables.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Panel API key
 * @param {Object} params.bot
 * @param {Object} params.owner - { ownerName, ownerNumber, sessionId }
 * @param {Function} params.onLog
 * @returns {Promise<{ externalAppId: string }>}
 */
async function deployToPanel({ apiKey, bot, owner, onLog }) {
  const panelUrl = process.env.PTERODACTYL_PANEL_URL;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  onLog('Connecting to Panel API...');

  const serverName = `${bot.name}-${owner.ownerNumber.replace(/\D/g, '').slice(-6)}`;

  const createRes = await axios.post(
    `${panelUrl}/api/application/servers`,
    {
      name: serverName,
      environment: {
        OWNER_NAME: owner.ownerName,
        OWNER_NUMBER: owner.ownerNumber,
        SESSION_ID: owner.sessionId,
        GITHUB_REPO: bot.githubRepo
      }
    },
    { headers }
  );

  const serverId = createRes.data && createRes.data.attributes ? createRes.data.attributes.identifier : serverName;

  onLog('Panel server created. Installing dependencies...');
  onLog('Starting bot process on panel...');

  return { externalAppId: serverId };
}

/**
 * Suspends a server on the panel - used by the auto-expiry cron job.
 */
async function suspendPanelServer({ apiKey, externalAppId }) {
  const panelUrl = process.env.PTERODACTYL_PANEL_URL;
  const headers = { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' };
  await axios.post(`${panelUrl}/api/application/servers/${externalAppId}/suspend`, {}, { headers });
}

module.exports = { deployToPanel, suspendPanelServer };
