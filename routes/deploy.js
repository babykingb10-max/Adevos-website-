const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');

const Bot = require('../models/Bot');
const Deployment = require('../models/Deployment');
const DeploymentPlatform = require('../models/DeploymentPlatform');
const User = require('../models/User');
const Settings = require('../models/Settings');
const userAuth = require('../middleware/userAuth');
const { dynamicDeploy, dynamicStop } = require('../services/dynamicDeploy');

// ---------- START A DEPLOYMENT ----------
// Body: { botId, ownerName, ownerNumber, sessionId, platformSlug, paymentMethod }
// paymentMethod: 'coins' | 'already_paid' (paystack/manual are verified separately via their own endpoints
//                 which set a short-lived "payment confirmed" flag before this is called)
router.post(
  '/deploy',
  userAuth,
  asyncHandler(async (req, res) => {
    const { botId, ownerName, ownerNumber, sessionId, platformSlug, paymentMethod } = req.body;

    if (!botId || !ownerName || !ownerNumber || !sessionId || !platformSlug) {
      return res.status(400).json({ success: false, message: 'Missing required deployment fields' });
    }

    const bot = await Bot.findById(botId);
    if (!bot || !bot.isActive) {
      return res.status(404).json({ success: false, message: 'Bot not found or inactive' });
    }

    const platform = await DeploymentPlatform.findOne({ slug: platformSlug, isActive: true });
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Deployment platform not found or inactive' });
    }

    const user = req.user;
    const settings = (await Settings.findOne({ singleton: 'main' })) || {};
    const coinsRequired = settings.coinsRequiredPerDeploy ?? 50;

    // A Deployer account with an active subscription can deploy without per-deploy payment.
    const isDeployerActive = user.isDeployer && user.deployerExpiry && user.deployerExpiry > new Date();

    if (!isDeployerActive) {
      if (paymentMethod === 'coins') {
        if (user.coins < coinsRequired) {
          return res.status(402).json({ success: false, message: `Insufficient AV Coins. Need ${coinsRequired}.` });
        }
        user.coins -= coinsRequired;
        await user.save();
      } else if (paymentMethod !== 'already_paid') {
        return res.status(402).json({ success: false, message: 'Payment required before deployment' });
      }
      // 'already_paid' assumes the Paystack webhook or admin manual-approval already ran for this user.
    }

    const deployment = await Deployment.create({
      user: user._id,
      bot: bot._id,
      ownerName,
      ownerNumber,
      sessionId,
      platform: platform._id,
      status: 'deploying',
      logs: [{ text: 'Deployment started' }]
    });

    res.json({ success: true, message: 'Deployment started', deploymentId: deployment._id });

    // Run the actual deploy asynchronously; logs are pushed to the Deployment doc as they happen
    // and can be polled via GET /api/deploy/logs/:id or streamed via SSE. This runs after the
    // response has already been sent, so any error here is caught locally and must NEVER be
    // allowed to become an unhandled rejection (it would crash the whole server for everyone).
    (async () => {
      try {
        const onLog = async (text) => {
          deployment.logs.push({ text });
          await deployment.save();
        };

        const result = await dynamicDeploy(platform.slug, bot, { ownerName, ownerNumber, sessionId }, onLog);

        deployment.status = 'online';
        deployment.isActive = true;
        deployment.externalAppId = result.externalAppId;
        deployment.logs.push({ text: 'Bot is online ✓' });
        await deployment.save();
      } catch (err) {
        deployment.status = 'failed';
        deployment.logs.push({ text: `Deployment failed: ${err.message}` });
        await deployment.save().catch(() => {});
      }
    })();
  })
);

// ---------- POLL DEPLOYMENT LOGS ----------
router.get(
  '/deploy/logs/:id',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment || String(deployment.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    res.json({ success: true, status: deployment.status, logs: deployment.logs });
  })
);

// ---------- SSE STREAM (alternative to polling) ----------
router.get(
  '/deploy/stream/:id',
  userAuth,
  asyncHandler(async (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    let lastLogCount = 0;
    const interval = setInterval(async () => {
      try {
        const deployment = await Deployment.findById(req.params.id);
        if (!deployment) return;

        if (deployment.logs.length > lastLogCount) {
          const newLogs = deployment.logs.slice(lastLogCount);
          newLogs.forEach((log) => res.write(`data: ${JSON.stringify(log)}\n\n`));
          lastLogCount = deployment.logs.length;
        }

        if (deployment.status === 'online' || deployment.status === 'failed') {
          res.write(`event: done\ndata: ${deployment.status}\n\n`);
          clearInterval(interval);
          res.end();
        }
      } catch (err) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => clearInterval(interval));
  })
);

// ---------- LIST MY DEPLOYMENTS ----------
router.get(
  '/deploy/mine',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployments = await Deployment.find({ user: req.user._id }).populate('bot platform');
    res.json({ success: true, data: deployments });
  })
);

// ---------- MANAGE: STOP / RESTART ----------
router.post(
  '/deploy/:id/stop',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id).populate('platform');
    if (!deployment || String(deployment.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    await dynamicStop(deployment.platform.slug, deployment.externalAppId);
    deployment.status = 'stopped';
    deployment.isActive = false;
    deployment.logs.push({ text: 'Bot stopped by user' });
    await deployment.save();
    res.json({ success: true, message: 'Bot stopped' });
  })
);

router.post(
  '/deploy/:id/restart',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id).populate('bot platform');
    if (!deployment || String(deployment.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    const onLog = async (text) => {
      deployment.logs.push({ text });
      await deployment.save();
    };
    try {
      const result = await dynamicDeploy(
        deployment.platform.slug,
        deployment.bot,
        { ownerName: deployment.ownerName, ownerNumber: deployment.ownerNumber, sessionId: deployment.sessionId },
        onLog
      );
      deployment.status = 'online';
      deployment.isActive = true;
      deployment.externalAppId = result.externalAppId;
      await deployment.save();
      res.json({ success: true, message: 'Bot restarted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  })
);

// ---------- UPDATE OWNER INFO / PLATFORM (re-deploy) ----------
router.put(
  '/deploy/:id',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id);
    if (!deployment || String(deployment.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    const { ownerName, ownerNumber, sessionId, platformSlug } = req.body;
    if (ownerName) deployment.ownerName = ownerName;
    if (ownerNumber) deployment.ownerNumber = ownerNumber;
    if (sessionId) deployment.sessionId = sessionId;
    if (platformSlug) {
      const platform = await DeploymentPlatform.findOne({ slug: platformSlug, isActive: true });
      if (platform) deployment.platform = platform._id;
    }
    await deployment.save();
    res.json({ success: true, message: 'Deployment info updated', data: deployment });
  })
);

// ---------- DELETE DEPLOYMENT ----------
router.delete(
  '/deploy/:id',
  userAuth,
  asyncHandler(async (req, res) => {
    const deployment = await Deployment.findById(req.params.id).populate('platform');
    if (!deployment || String(deployment.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Deployment not found' });
    }
    if (deployment.isActive) {
      await dynamicStop(deployment.platform.slug, deployment.externalAppId);
    }
    await deployment.deleteOne();
    res.json({ success: true, message: 'Deployment deleted' });
  })
);

module.exports = router;
