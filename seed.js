/**
 * Seed script — run once after setting up your .env and MongoDB Atlas connection:
 *
 *   node seed.js
 *
 * This is now just a thin CLI wrapper around defaults.js — the same default content
 * is also used as a live fallback by the public API (so the site is never blank even
 * if you skip this step) and by the "Load Default Content" button in the Admin Panel.
 * Running this script simply turns those defaults into real, editable database
 * records right away, which is convenient for local development or a fresh deploy.
 *
 * Safe to re-run — it skips any collection that already has data, and upserts
 * DeploymentPlatform + Settings by their unique keys instead of duplicating them.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const defaults = require('./defaults');

const DeploymentPlatform = require('./models/DeploymentPlatform');
const Settings = require('./models/Settings');
const Service = require('./models/Service');
const SidebarItem = require('./models/SidebarItem');
const Slide = require('./models/Slide');
const TouchCard = require('./models/TouchCard');
const Testimonial = require('./models/Testimonial');
const Update = require('./models/Update');
const Bot = require('./models/Bot');
const Tutorial = require('./models/Tutorial');
const Translation = require('./models/Translation');

async function seedCollection(Model, name, items) {
  if ((await Model.countDocuments()) === 0) {
    await Model.insertMany(items.map(defaults.stripDefaultFlags));
    console.log(`[seed] Default ${name} created`);
  } else {
    console.log(`[seed] ${name} already has data — left untouched`);
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[seed] Connected to MongoDB');

  // ---------------------------------------------------------------------
  // Deployment platforms
  // ---------------------------------------------------------------------
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

  // ---------------------------------------------------------------------
  // Global settings — created once, then left alone on re-runs so admin
  // edits are never overwritten by this script.
  // ---------------------------------------------------------------------
  const existingSettings = await Settings.findOne({ singleton: 'main' });
  if (!existingSettings) {
    await Settings.create({ singleton: 'main', ...defaults.settings });
    console.log('[seed] Default settings created (edit freely from Admin -> Settings)');
  } else {
    console.log('[seed] Settings already exist — left untouched');
  }

  // ---------------------------------------------------------------------
  // Content collections
  // ---------------------------------------------------------------------
  await seedCollection(Service, 'services', defaults.services);
  await seedCollection(Slide, 'slides', defaults.slides);
  await seedCollection(TouchCard, 'touch cards', defaults.touchCards);
  await seedCollection(Testimonial, 'testimonials', defaults.testimonials);
  await seedCollection(Update, 'update log entries', defaults.updates);
  await seedCollection(Bot, 'bot catalog', defaults.bots);
  await seedCollection(Tutorial, 'tutorials', defaults.tutorials);
  await seedCollection(SidebarItem, 'sidebar menu', defaults.sidebarItems);
  await seedCollection(Translation, 'translations (en/sw/fr)', defaults.translations);

  console.log('[seed] Done. Start the server with: npm start');
  console.log('[seed] Everything created here can be edited or deleted from the Admin Panel at /admin');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
