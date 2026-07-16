const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // e.g. "btn_deploy"
    values: { type: Map, of: String, default: {} } // { en: "Deploy", sw: "Tuma", fr: "Déployer" }
  },
  { timestamps: true }
);

TranslationSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model('Translation', TranslationSchema);
