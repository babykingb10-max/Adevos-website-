const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Settings = require('../models/Settings');
const userAuth = require('../middleware/userAuth');

// ---------- CREATE CHECKOUT LINK ----------
// Body: { purpose: 'coins_topup' | 'deployer_subscription' | 'renewal' | 'bot_deploy' }
router.post('/checkout', userAuth, async (req, res) => {
  try {
    const { purpose } = req.body;
    const settings = (await Settings.findOne({ singleton: 'main' })) || {};

    const amountMap = {
      bot_deploy: settings.botDeploymentPriceUSD ?? 5,
      deployer_subscription: settings.deployerMonthlyPriceUSD ?? 10,
      renewal: settings.deployerMonthlyPriceUSD ?? 10,
      coins_topup: 5
    };
    const amountUSD = amountMap[purpose];
    if (!amountUSD) return res.status(400).json({ success: false, message: 'Invalid purpose' });

    const reference = `AVX-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const transaction = await Transaction.create({
      user: req.user._id,
      method: 'paystack',
      purpose,
      amount: amountUSD,
      reference,
      status: 'pending'
    });

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: Math.round(amountUSD * 100), // Paystack expects the smallest currency unit
        reference,
        callback_url: `${process.env.PUBLIC_SITE_URL}/payment-callback.html`
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    res.json({
      success: true,
      checkoutUrl: paystackRes.data.data.authorization_url,
      reference,
      transactionId: transaction._id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- WEBHOOK ----------
// Paystack calls this after a successful payment. We verify the signature, then verify the
// transaction with Paystack's API before crediting the user.
router.post('/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const expectedSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(401).send('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const reference = event.data.reference;

      // Confirm directly with Paystack (defense in depth, don't just trust the webhook payload).
      const verifyRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });

      if (verifyRes.data.data.status === 'success') {
        const transaction = await Transaction.findOne({ reference });
        if (transaction && transaction.status !== 'completed') {
          transaction.status = 'completed';
          await transaction.save();

          const user = await User.findById(transaction.user);
          if (user) {
            if (transaction.purpose === 'coins_topup') {
              user.coins += 50;
            } else if (transaction.purpose === 'deployer_subscription' || transaction.purpose === 'renewal') {
              const now = new Date();
              const base = user.deployerExpiry && user.deployerExpiry > now ? user.deployerExpiry : now;
              user.deployerExpiry = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
              user.isDeployer = true;
              user.lastReminderSentDays = null; // reset reminder tracking on renewal
            }
            await user.save();
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[paystack webhook] error:', err.message);
    res.sendStatus(500);
  }
});

// ---------- CHECK TRANSACTION STATUS (used by frontend after redirect back) ----------
router.get(
  '/status/:reference',
  userAuth,
  asyncHandler(async (req, res) => {
    const transaction = await Transaction.findOne({ reference: req.params.reference });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, status: transaction.status });
  })
);

module.exports = router;
