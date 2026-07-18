const mongoose = require('mongoose');

const TutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "How to deploy WhatsApp Bot"
    description: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-play-circle' }, // FontAwesome class
    videoUrl: { type: String, default: '' }, // direct video file URL, or a YouTube/Vimeo link
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tutorial', TutorialSchema);
