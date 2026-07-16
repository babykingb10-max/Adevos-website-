const express = require('express');
const router = express.Router();

const Slide = require('../models/Slide');
const Service = require('../models/Service');
const TouchCard = require('../models/TouchCard');
const Update = require('../models/Update');
const Testimonial = require('../models/Testimonial');
const SidebarItem = require('../models/SidebarItem');
const Bot = require('../models/Bot');
const DeploymentPlatform = require('../models/DeploymentPlatform');
const Music = require('../models/Music');
const Translation = require('../models/Translation');
const Currency = require('../models/Currency');
const Settings = require('../models/Settings');
const User = require('../models/User');
const userAuth = require('../middleware/userAuth');
const { getAssistantReply } = require('../services/assistantService');

// ---------- CONTENT ----------
router.get('/slides', async (req, res) => {
  const slides = await Slide.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: slides });
});

router.get('/services', async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: services });
});

router.get('/touch-cards', async (req, res) => {
  const cards = await TouchCard.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: cards });
});

router.get('/updates', async (req, res) => {
  const updates = await Update.find({ isActive: true }).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, data: updates });
});

router.get('/testimonials', async (req, res) => {
  const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: testimonials });
});

router.get('/sidebar', async (req, res) => {
  const items = await SidebarItem.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: items });
});

// ---------- BOTS ----------
router.get('/bots', async (req, res) => {
  const bots = await Bot.find({ isActive: true }).sort({ addedDate: -1 });
  res.json({ success: true, data: bots });
});

router.get('/bot/:id', async (req, res) => {
  const bot = await Bot.findById(req.params.id);
  if (!bot) return res.status(404).json({ success: false, message: 'Bot not found' });
  res.json({ success: true, data: bot });
});

// ---------- PLATFORMS ----------
router.get('/platforms', async (req, res) => {
  const platforms = await DeploymentPlatform.find({ isActive: true }).select('name slug');
  res.json({ success: true, data: platforms });
});

// ---------- MUSIC ----------
router.get('/music', async (req, res) => {
  const music = await Music.findOne();
  res.json({ success: true, data: music || { tracks: [], autoplay: false, volume: 70 } });
});

// ---------- I18N ----------
router.get('/translations', async (req, res) => {
  const lang = req.query.lang || 'en';
  const translations = await Translation.find();
  const result = {};
  translations.forEach((t) => {
    result[t.key] = t.values.get(lang) || t.values.get('en') || '';
  });
  res.json({ success: true, lang, data: result });
});

// ---------- PRICING / CURRENCY ----------
router.get('/pricing', async (req, res) => {
  const settings = (await Settings.findOne({ singleton: 'main' })) || {};
  const countryCode = (req.headers['cf-ipcountry'] || '').toUpperCase();

  let currency = null;
  if (countryCode) {
    currency = await Currency.findOne({ countryCodes: countryCode, isActive: true });
  }

  const basePrices = {
    deployerMonthly: settings.deployerMonthlyPriceUSD ?? 10,
    botDeployment: settings.botDeploymentPriceUSD ?? 5
  };

  if (!currency) {
    return res.json({
      success: true,
      currency: { code: 'USD', symbol: '$', exchangeRate: 1 },
      prices: basePrices
    });
  }

  const converted = {};
  Object.entries(basePrices).forEach(([key, usd]) => {
    converted[key] = Number((usd * currency.exchangeRate).toFixed(2));
  });

  res.json({
    success: true,
    currency: { code: currency.code, symbol: currency.symbol, exchangeRate: currency.exchangeRate },
    prices: converted
  });
});

// ---------- ASSISTANT CHAT ----------
router.post('/assistant', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
  const reply = await getAssistantReply(message);
  res.json({ success: true, reply });
});

// ---------- CURRENT USER (requires auth, no ID needed) ----------
router.get('/me', userAuth, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// ---------- CURRENT USER (requires auth) ----------
router.get('/user/:id', userAuth, async (req, res) => {
  if (String(req.user._id) !== req.params.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  res.json({ success: true, data: req.user });
});

// ---------- REFERRAL SIGNUP TRACKING ----------
// Called by the frontend once, right after a fresh signup, with the ?ref=CODE query param.
router.post('/referral/claim', userAuth, async (req, res) => {
  const { refCode } = req.body;
  if (!refCode) return res.status(400).json({ success: false, message: 'refCode is required' });

  const referrer = await User.findOne({ referralCode: refCode });
  if (!referrer) return res.status(404).json({ success: false, message: 'Referral code not found' });
  if (String(referrer._id) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'Cannot refer yourself' });
  }
  if (req.user.referredBy) {
    return res.status(400).json({ success: false, message: 'Referral already claimed for this account' });
  }

  const settings = (await Settings.findOne({ singleton: 'main' })) || {};
  const coinsPerReferral = settings.coinsPerReferral ?? 2;

  referrer.coins += coinsPerReferral;
  await referrer.save();

  req.user.referredBy = referrer._id;
  await req.user.save();

  res.json({ success: true, message: `Referral credited. ${referrer.name} earned ${coinsPerReferral} AV Coins.` });
});

router.post('/referral/generate', userAuth, async (req, res) => {
  if (req.user.referralCode) {
    return res.json({ success: true, referralCode: req.user.referralCode });
  }
  const code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  req.user.referralCode = code;
  await req.user.save();
  res.json({ success: true, referralCode: code });
});

module.exports = router;
