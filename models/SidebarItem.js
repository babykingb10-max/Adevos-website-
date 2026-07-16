const mongoose = require('mongoose');

const SidebarItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    icon: { type: String, required: true }, // FontAwesome class
    group: { type: String, required: true }, // e.g. "Home", "Bot Platform", "Support"
    actionType: { type: String, enum: ['internal', 'external'], default: 'internal' },
    action: { type: String, default: '' }, // internal action key (e.g. "openDeployModal")
    url: { type: String, default: '' }, // used when actionType === 'external'
    badge: { type: Number, default: null }, // e.g. notification count
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SidebarItem', SidebarItemSchema);
