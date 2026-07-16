const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. "TZS"
    symbol: { type: String, required: true }, // e.g. "TSh"
    exchangeRate: { type: Number, required: true }, // relative to 1 USD
    countryCodes: [{ type: String }], // ISO country codes that map to this currency, e.g. ["TZ"]
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Currency', CurrencySchema);
