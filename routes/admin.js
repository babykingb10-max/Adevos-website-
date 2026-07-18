const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const defaults = require('../defaults');

const Slide = require('../models/Slide');
const Service = require('../models/Service');
const TouchCard = require('../models/TouchCard');
const Update = require('../models/Update');
const Testimonial = require('../models/Testimonial');
const SidebarItem = require('../models/SidebarItem');
const Bot = require('../models/Bot');
const Tutorial = require('../models/Tutorial');
const DeploymentPlatform = require('../models/DeploymentPlatform');
const Deployment = require('../models/Deployment');
const Music = require('../models/Music');
const Translation = require('../models/Translation');
const Currency = require('../models/Currency');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Settings = require('../models/Settings');

router.use(adminAuth);

// ---------------------------------------------------------------------------
// Generic CRUD factory — mounts GET (list), POST (create), PUT /:id (update),
// DELETE /:id for a given Mongoose model at the given path. This mirrors the
// "GET/admin/... POST/PUT/DELETE to modify" pattern described for content models.
// ---------------------------------------------------------------------------
function mountCrud(path, Model, options = {}) {
  const sortBy = options.sortBy || { order: 1 };

  router.get(path, async (req, res) => {
    const docs = await Model.find().sort(sortBy);
    res.json({ success: true, data: docs });
  });

  router.post(path, async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  router.put(`${path}/:id`, async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: doc });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  router.delete(`${path}/:id`, async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  });
}

mountCrud('/slides', Slide);
mountCrud('/services', Service);
mountCrud('/touch-cards', TouchCard);
mountCrud('/updates', Update, { sortBy: { createdAt: -1 } });
mountCrud('/testimonials', Testimonial);
mountCrud('/sidebar', SidebarItem);
mountCrud('/bots', Bot, { sortBy: { addedDate: -1 } });
mountCrud('/tutorials', Tutorial);
mountCrud('/platforms', DeploymentPlatform, { sortBy: { name: 1 } });
mountCrud('/currencies', Currency, { sortBy: { code: 1 } });

// ---------------------------------------------------------------------------
// "Load Default Content" — turns the shipped demo content (defaults.js) into
// real, editable database records for a given collection (or all of them).
// Only inserts into collections that are currently EMPTY, so it never
// duplicates or overwrites content the admin has already customized.
// ---------------------------------------------------------------------------
const DEFAULT_LOADERS = {
  slides: { Model: Slide, data: defaults.slides },
  services: { Model: Service, data: defaults.services },
  'touch-cards': { Model: TouchCard, data: defaults.touchCards },
  testimonials: { Model: Testimonial, data: defaults.testimonials },
  updates: { Model: Update, data: defaults.updates },
  bots: { Model: Bot, data: defaults.bots },
  tutorials: { Model: Tutorial, data: defaults.tutorials },
  sidebar: { Model: SidebarItem, data: defaults.sidebarItems },
  translations: { Model: Translation, data: defaults.translations }
};

router.post('/defaults/load/:type', async (req, res) => {
  const { type } = req.params;

  if (type === 'settings') {
    const existing = await Settings.findOne({ singleton: 'main' });
    if (existing) return res.json({ success: true, message: 'Settings already exist — left untouched', loaded: false });
    await Settings.create({ singleton: 'main', ...defaults.settings });
    return res.json({ success: true, message: 'Default settings loaded', loaded: true });
  }

  if (type === 'all') {
    const results = {};
    for (const key of Object.keys(DEFAULT_LOADERS)) {
      const { Model, data } = DEFAULT_LOADERS[key];
      const count = await Model.countDocuments();
      if (count === 0) {
        await Model.insertMany(data.map(defaults.stripDefaultFlags));
        results[key] = 'loaded';
      } else {
        results[key] = 'skipped (already has data)';
      }
    }
    const existingSettings = await Settings.findOne({ singleton: 'main' });
    if (!existingSettings) {
      await Settings.create({ singleton: 'main', ...defaults.settings });
      results.settings = 'loaded';
    } else {
      results.settings = 'skipped (already has data)';
    }
    return res.json({ success: true, message: 'Default content load complete', results });
  }

  const loader = DEFAULT_LOADERS[type];
  if (!loader) return res.status(400).json({ success: false, message: `Unknown default content type: ${type}` });

  const count = await loader.Model.countDocuments();
  if (count > 0) {
    return res.json({ success: true, message: 'This collection already has content — nothing was changed', loaded: false });
  }
  await loader.Model.insertMany(loader.data.map(defaults.stripDefaultFlags));
  res.json({ success: true, message: 'Default content loaded — you can now edit it below', loaded: true });
});

// ---------------------------------------------------------------------------
// Music (single-document editor rather than list CRUD)
// ---------------------------------------------------------------------------
router.get('/music', async (req, res) => {
  let music = await Music.findOne();
  if (!music) music = await Music.create({ tracks: [], autoplay: false, volume: 70 });
  res.json({ success: true, data: music });
});
router.put('/music', async (req, res) => {
  let music = await Music.findOne();
  if (!music) music = new Music();
  Object.assign(music, req.body);
  await music.save();
  res.json({ success: true, data: music });
});

// ---------------------------------------------------------------------------
// Translations (i18n)
// ---------------------------------------------------------------------------
router.get('/translations', async (req, res) => {
  const translations = await Translation.find();
  res.json({ success: true, data: translations });
});
router.post('/translations', async (req, res) => {
  const { key, values } = req.body;
  const translation = await Translation.findOneAndUpdate(
    { key },
    { key, values },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ success: true, data: translation });
});
router.delete('/translations/:id', async (req, res) => {
  await Translation.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ---------------------------------------------------------------------------
// Deployments (view all, admin-level stop)
// ---------------------------------------------------------------------------
router.get('/deployments', async (req, res) => {
  const deployments = await Deployment.find().populate('user bot platform').sort({ createdAt: -1 });
  res.json({ success: true, data: deployments });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});
router.put('/users/:id', async (req, res) => {
  const allowedFields = ['coins', 'isDeployer', 'deployerExpiry', 'subscriptionExpiry', 'role'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });
  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});
router.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

// ---------------------------------------------------------------------------
// Payments — list + manual payment verification ("Verify and Approve" button)
// ---------------------------------------------------------------------------
router.get('/payments', async (req, res) => {
  const transactions = await Transaction.find().populate('user').sort({ createdAt: -1 });
  res.json({ success: true, data: transactions });
});

router.post('/payments/:id/approve', async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('user');
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
  if (transaction.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Already completed' });
  }

  transaction.status = 'completed';
  transaction.verifiedBy = req.admin && req.admin._id ? req.admin._id : null;
  await transaction.save();

  const user = transaction.user;
  if (user) {
    if (transaction.purpose === 'coins_topup') {
      user.coins += 50;
    } else if (transaction.purpose === 'deployer_subscription' || transaction.purpose === 'renewal') {
      const now = new Date();
      const base = user.deployerExpiry && user.deployerExpiry > now ? user.deployerExpiry : now;
      user.deployerExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
      user.isDeployer = true;
      user.lastReminderSentDays = null;
    }
    await user.save();
  }

  res.json({ success: true, message: 'Payment approved and account updated', data: transaction });
});

router.post('/payments/:id/reject', async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { status: 'failed' },
    { new: true }
  );
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
  res.json({ success: true, message: 'Payment rejected', data: transaction });
});

// ---------------------------------------------------------------------------
// Global settings (discounts, prices, assistant replies, platform links)
// ---------------------------------------------------------------------------
router.get('/settings', async (req, res) => {
  let settings = await Settings.findOne({ singleton: 'main' });
  if (!settings) settings = await Settings.create({ singleton: 'main' });
  res.json({ success: true, data: settings });
});
router.put('/settings', async (req, res) => {
  let settings = await Settings.findOne({ singleton: 'main' });
  if (!settings) settings = new Settings({ singleton: 'main' });
  Object.assign(settings, req.body);
  await settings.save();
  res.json({ success: true, data: settings });
});

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  const [userCount, botCount, activeDeployments, pendingPayments] = await Promise.all([
    User.countDocuments(),
    Bot.countDocuments({ isActive: true }),
    Deployment.countDocuments({ isActive: true }),
    Transaction.countDocuments({ status: 'pending' })
  ]);
  res.json({ success: true, data: { userCount, botCount, activeDeployments, pendingPayments } });
});

module.exports = router;
