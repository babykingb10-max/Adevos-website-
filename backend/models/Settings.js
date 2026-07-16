const mongoose = require('mongoose');

// A single-document collection holding global, admin-editable settings.
const SettingsSchema = new mongoose.Schema(
  {
    singleton: { type: String, default: 'main', unique: true },

    // Early renewal discount
    earlyRenewalDiscount: { type: Number, default: 20 }, // percent
    earlyRenewalWindowDays: { type: Number, default: 7 },

    // Pricing
    deployerMonthlyPriceUSD: { type: Number, default: 10 },
    botDeploymentPriceUSD: { type: Number, default: 5 },
    coinsRequiredPerDeploy: { type: Number, default: 50 },
    coinsPerReferral: { type: Number, default: 2 },

    // Assistant custom replies (overrides keyword logic), keyed by keyword
    assistantReplies: { type: Map, of: String, default: {} },

    // Platform / support links
    platformLinks: {
      whatsappCommunity: { type: String, default: '' },
      whatsappChannel: { type: String, default: '' },
      telegramChannel: { type: String, default: '' },
      whatsappSupportNumber: { type: String, default: '' },
      manualPaymentNumbers: [
        {
          label: { type: String },
          number: { type: String }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
