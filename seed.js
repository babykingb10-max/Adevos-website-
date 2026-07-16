/**
 * Seed script — run once after setting up your .env and MongoDB Atlas connection:
 *
 *   node seed.js
 *
 * This creates the DeploymentPlatform records (Heroku/Panel), a default Settings
 * document, and a few starter content records so the public site isn't empty on
 * first load. Safe to re-run — it won't duplicate records that already exist.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const DeploymentPlatform = require('./models/DeploymentPlatform');
const Settings = require('./models/Settings');
const Service = require('./models/Service');
const SidebarItem = require('./models/SidebarItem');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed] Connected to MongoDB');

  // ---- Deployment platforms ----
  await DeploymentPlatform.findOneAndUpdate(
    { slug: 'heroku' },
    { name: 'Heroku', slug: 'heroku', envKey: 'HEROKU_API_KEY', moduleName: 'deployHeroku', isActive: true },
    { upsert: true }
  );
  await DeploymentPlatform.findOneAndUpdate(
    { slug: 'panel' },
    { name: 'Panel', slug: 'panel', envKey: 'PTERODACTYL_API_KEY', moduleName: 'deployPanel', isActive: true },
    { upsert: true }
  );
  console.log('[seed] Deployment platforms ready');

  // ---- Global settings ----
  const existingSettings = await Settings.findOne({ singleton: 'main' });
  if (!existingSettings) {
    await Settings.create({ singleton: 'main' });
    console.log('[seed] Default settings created');
  }

  // ---- Services (only if empty) ----
  const serviceCount = await Service.countDocuments();
  if (serviceCount === 0) {
    await Service.insertMany([
      { icon: 'fas fa-code', title: 'Web Development', description: 'Custom websites and web apps built with modern stacks, optimized for speed and scale.', order: 1 },
      { icon: 'fab fa-whatsapp', title: 'WhatsApp Bots', description: 'Powerful automated bots for business, customer service, and entertainment.', order: 2 },
      { icon: 'fas fa-rocket', title: 'Bot Deployment', description: 'Seamless hosting and deployment for your bots with 99% uptime guaranteed.', order: 3 },
      { icon: 'fas fa-brain', title: 'AI Solutions', description: 'Custom AI integrations and solutions to power your next-generation applications.', order: 4 },
      { icon: 'fab fa-telegram-plane', title: 'Telegram Bots', description: 'High-speed Telegram integrations for community management and utilities.', order: 5 },
      { icon: 'fas fa-shield-alt', title: 'Cyber Security', description: 'Protect your digital assets with enterprise-grade security consulting.', order: 6 }
    ]);
    console.log('[seed] Sample services created');
  }

  // ---- Sidebar menu (only if empty) ----
  const sidebarCount = await SidebarItem.countDocuments();
  if (sidebarCount === 0) {
    await SidebarItem.insertMany([
      { label: 'Dashboard', icon: 'fas fa-th-large', group: 'Home', action: 'scrollTop', order: 1 },
      { label: 'Latest News', icon: 'fas fa-newspaper', group: 'Updates', action: 'navigateUpdates', order: 1 },
      { label: 'Deploy bot', icon: 'fas fa-robot', group: 'Bot Platform', action: 'openDeployModal', order: 1 },
      { label: 'Manage your bot', icon: 'fas fa-tasks', group: 'Bot Platform', action: 'openManageBotModal', order: 2 },
      { label: 'My Adevos Coins', icon: 'fas fa-coins', group: 'Bot Platform', action: 'openCoinsPage', order: 3 },
      { label: 'User Account', icon: 'fas fa-user', group: 'My Account', action: 'openUserAccountPage', order: 1 },
      { label: 'Deployer Account', icon: 'fas fa-user-shield', group: 'My Account', action: 'openDeployerAccountModal', order: 2 },
      { label: 'Watch Tutorials', icon: 'fas fa-graduation-cap', group: 'Tutorials', action: 'openTutorialsModal', order: 1 },
      { label: 'Send your feedback', icon: 'fas fa-paper-plane', group: 'Feedback', action: 'openFeedback', order: 1 },
      { label: 'Community', icon: 'fas fa-users', group: 'Support', action: 'openSupport', order: 1 }
    ]);
    console.log('[seed] Sidebar menu created');
  }

  console.log('[seed] Done. You can now start the server with: npm start');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
