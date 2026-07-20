const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');

const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const userAuth = require('../middleware/userAuth');

// ---------- SUBMIT A MANUAL PAYMENT (M-Pesa / Tigo Pesa) ----------
// Creates a pending Transaction. The user then sends their receipt screenshot to
// Admin via WhatsApp; Admin approves it from the Admin Panel (see routes/admin.js).
router.post(
  '/manual',
  userAuth,
  asyncHandler(async (req, res) => {
    const { purpose, receiptNote } = req.body;
    if (!purpose) return res.status(400).json({ success: false, message: 'purpose is required' });

    const settings = (await Settings.findOne({ singleton: 'main' })) || {};

    if (settings.manualPayment && settings.manualPayment.enabled === false) {
      return res.status(403).json({ success: false, message: 'Manual payment is currently disabled. Please use Paystack or AV Coins.' });
    }

    const amountMap = {
      bot_deploy: settings.botDeploymentPriceUSD ?? 5,
      deployer_subscription: settings.deployerMonthlyPriceUSD ?? 10,
      renewal: settings.deployerMonthlyPriceUSD ?? 10,
      coins_topup: 5
    };
    const amountUSD = amountMap[purpose];
    if (!amountUSD) return res.status(400).json({ success: false, message: 'Invalid purpose' });

    const transaction = await Transaction.create({
      user: req.user._id,
      method: 'manual',
      purpose,
      amount: amountUSD,
      receiptNote: receiptNote || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Manual payment recorded. Send your receipt via WhatsApp for verification.',
      data: transaction
    });
  })
);

// ---------- CHECK MY MANUAL PAYMENT STATUS ----------
router.get(
  '/manual/:id',
  userAuth,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction || String(transaction.user) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, status: transaction.status });
  })
);

// ---------- MY TRANSACTION HISTORY ----------
router.get(
  '/mine',
  userAuth,
  asyncHandler(async (req, res) => {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  })
);

// ---------- EARLY RENEWAL PRICE CALCULATION ----------
router.get(
  '/early-renewal-quote',
  userAuth,
  asyncHandler(async (req, res) => {
    const settings = (await Settings.findOne({ singleton: 'main' })) || {};
    const discount = settings.earlyRenewalDiscount ?? 20;
    const window = settings.earlyRenewalWindowDays ?? 7;
    const basePrice = settings.deployerMonthlyPriceUSD ?? 10;

    const expiry = req.user.deployerExpiry || req.user.subscriptionExpiry;
    if (!expiry) {
      return res.json({ success: true, eligible: false, finalPrice: basePrice, basePrice });
    }

    const daysLeft = Math.ceil((expiry - new Date()) / (24 * 60 * 60 * 1000));
    const eligible = daysLeft <= window && daysLeft > 0;
    const finalPrice = eligible ? Number((basePrice * (1 - discount / 100)).toFixed(2)) : basePrice;

    res.json({ success: true, eligible, daysLeft, discount, basePrice, finalPrice });
  })
);

module.exports = router;
