const cron = require('node-cron');
const axios = require('axios');
const User = require('../models/User');
const Deployment = require('../models/Deployment');
const DeploymentPlatform = require('../models/DeploymentPlatform');
const Currency = require('../models/Currency');
const Settings = require('../models/Settings');
const { sendExpiryReminder } = require('./emailService');
const { dynamicStop } = require('./dynamicDeploy');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 03:00 daily — checks deployerExpiry / subscriptionExpiry.
 * If expired: stops all of that user's active bots on their hosting platform and marks them inactive.
 */
function scheduleAutoExpiry() {
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[cron] Running auto-expiry check...');
      const now = new Date();

      const expiredUsers = await User.find({
        $or: [
          { deployerExpiry: { $lte: now, $ne: null } },
          { subscriptionExpiry: { $lte: now, $ne: null } }
        ]
      });

      for (const user of expiredUsers) {
        const activeDeployments = await Deployment.find({ user: user._id, isActive: true }).populate('platform');

        for (const deployment of activeDeployments) {
          try {
            const platform = await DeploymentPlatform.findById(deployment.platform);
            if (platform) {
              await dynamicStop(platform.slug, deployment.externalAppId);
            }
            deployment.isActive = false;
            deployment.status = 'suspended';
            deployment.logs.push({ text: 'Auto-suspended: subscription expired' });
            await deployment.save();
          } catch (err) {
            console.error(`[cron] Failed to stop deployment ${deployment._id}:`, err.message);
          }
        }

        if (user.deployerExpiry && user.deployerExpiry <= now) user.isDeployer = false;
        await user.save();
      }

      console.log(`[cron] Auto-expiry processed ${expiredUsers.length} user(s).`);
    } catch (err) {
      console.error('[cron] Auto-expiry job failed:', err.message);
    }
  });
}

/**
 * 03:00 daily — sends reminder emails 7 days and 1 day before expiry, including
 * early-renewal discount info when within the discount window.
 */
function scheduleEmailReminders() {
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[cron] Running expiry reminder check...');
      const settings = (await Settings.findOne({ singleton: 'main' })) || {};
      const discountPercent = settings.earlyRenewalDiscount ?? 20;

      const now = new Date();
      const usersWithExpiry = await User.find({
        $or: [{ deployerExpiry: { $ne: null } }, { subscriptionExpiry: { $ne: null } }]
      });

      for (const user of usersWithExpiry) {
        const expiry = user.deployerExpiry || user.subscriptionExpiry;
        if (!expiry) continue;

        const daysLeft = Math.ceil((expiry - now) / MS_PER_DAY);

        if ((daysLeft === 7 || daysLeft === 1) && user.lastReminderSentDays !== daysLeft) {
          try {
            await sendExpiryReminder({
              to: user.email,
              name: user.name,
              expiryDate: expiry.toDateString(),
              daysLeft,
              discountPercent
            });
            user.lastReminderSentDays = daysLeft;
            await user.save();
          } catch (err) {
            console.error(`[cron] Failed to send reminder to ${user.email}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error('[cron] Email reminder job failed:', err.message);
    }
  });
}

/**
 * 06:00 daily — refreshes exchange rates for all active currencies from exchangerate-api.com.
 */
function scheduleCurrencyUpdate() {
  cron.schedule('0 6 * * *', async () => {
    console.log('[cron] Updating currency exchange rates...');
    if (!process.env.EXCHANGE_RATE_API_KEY) {
      console.warn('[cron] EXCHANGE_RATE_API_KEY not set — skipping currency update.');
      return;
    }
    try {
      const res = await axios.get(
        `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_RATE_API_KEY}/latest/USD`
      );
      const rates = res.data.conversion_rates;
      const currencies = await Currency.find({ isActive: true });

      for (const currency of currencies) {
        if (rates[currency.code]) {
          currency.exchangeRate = rates[currency.code];
          await currency.save();
        }
      }
      console.log(`[cron] Updated ${currencies.length} currencies.`);
    } catch (err) {
      console.error('[cron] Currency update failed:', err.message);
    }
  });
}

function initCronJobs() {
  scheduleAutoExpiry();
  scheduleEmailReminders();
  scheduleCurrencyUpdate();
  console.log('[cron] All scheduled jobs initialized.');
}

module.exports = { initCronJobs };
