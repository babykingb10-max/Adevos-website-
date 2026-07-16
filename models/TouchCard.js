const mongoose = require('mongoose');

const TouchCardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, required: true }, // Cloudinary URL
    layout: { type: String, enum: ['top', 'bottom', 'left', 'right'], default: 'top' },
    cardType: {
      type: String,
      enum: ['deploy', 'deployer', 'manage', 'tutorial', 'feedback', 'support', 'developer', 'updates', 'generic'],
      default: 'generic'
    },
    buttonText: { type: String, default: '' },
    buttonAction: { type: String, default: '' }, // internal action name or external URL
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TouchCard', TouchCardSchema);
