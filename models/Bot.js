const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // shown bold to users
    description: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    author: { type: String, default: 'Adevos-X Team' },
    addedDate: { type: Date, default: Date.now },
    githubRepo: { type: String, required: true },
    pairSite: { type: String, required: true }, // each bot has its own unique pairing page
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bot', BotSchema);
