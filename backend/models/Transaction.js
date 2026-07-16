const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['paystack', 'manual', 'coins'], required: true },
    purpose: { type: String, enum: ['coins_topup', 'deployer_subscription', 'renewal', 'bot_deploy'], required: true },
    amount: { type: Number, required: true }, // in USD
    currency: { type: String, default: 'USD' },
    reference: { type: String, unique: true, sparse: true }, // Paystack reference
    receiptNote: { type: String, default: '' }, // for manual payments (WhatsApp receipt reference)
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null } // admin who approved manual payment
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
