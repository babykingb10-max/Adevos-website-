const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema(
  {
    icon: { type: String, required: true }, // FontAwesome class e.g. "fas fa-code"
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', ServiceSchema);
