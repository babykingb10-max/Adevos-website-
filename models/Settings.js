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

    // "Get a Free Bot" button in the Deploy modal — admin can toggle it on/off and
    // point it at a WhatsApp link (or any URL) without touching code.
    freeBot: {
      enabled: { type: Boolean, default: true },
      whatsappLink: { type: String, default: '' }
    },

    // Manual payment (M-Pesa / Tigo Pesa / bank) — admin can disable this payment
    // method entirely, or edit the numbers customers should send money to.
    manualPayment: {
      enabled: { type: Boolean, default: true },
      instructions: {
        type: String,
        default: "Send payment to any of the numbers below, then screenshot and send proof to our WhatsApp."
      },
      numbers: [
        {
          label: { type: String }, // e.g. "Ahmed — M-Pesa / Airtel"
          number: { type: String } // e.g. "+255 XXX XXX XXX"
        }
      ]
    },

    // "Stay Connected" social links — empty by default, admin fills in the ones they use.
    // Any link left empty is simply hidden on the public site instead of showing a dead "#" link.
    socialLinks: {
      twitter: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
      youtube: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      telegram: { type: String, default: '' },
      tiktok: { type: String, default: '' }
    },

    // Platform / support links
    platformLinks: {
      whatsappCommunity: { type: String, default: '' },
      whatsappChannel: { type: String, default: '' },
      telegramChannel: { type: String, default: '' },
      whatsappSupportNumber: { type: String, default: '' },
      developerContactLink: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
