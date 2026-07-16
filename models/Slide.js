const mongoose = require('mongoose');

const SlideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true }, // Cloudinary URL
    ctaText: { type: String, default: 'Learn More' },
    ctaAction: { type: String, default: '' }, // e.g. 'support', 'tutorials', 'coins', 'deployer', or a URL
    layout: { type: String, enum: ['top', 'bottom', 'left', 'right'], default: 'bottom' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Slide', SlideSchema);
