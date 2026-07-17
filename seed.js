/**
 * Seed script — run once after setting up your .env and MongoDB Atlas connection:
 *
 *   node seed.js
 *
 * This populates the database with the SAME default content the original static demo
 * shipped with (slides, services, touch cards, sidebar menu, testimonials, sample bots,
 * update logs) plus sane default Settings (manual payment numbers, free bot toggle,
 * pricing, discounts). Everything this script creates is fully editable or deletable
 * from the Admin Panel afterwards — this just avoids the public site launching empty.
 *
 * Safe to re-run — it skips any collection that already has data, and upserts
 * DeploymentPlatform + Settings by their unique keys instead of duplicating them.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const DeploymentPlatform = require('./models/DeploymentPlatform');
const Settings = require('./models/Settings');
const Service = require('./models/Service');
const SidebarItem = require('./models/SidebarItem');
const Slide = require('./models/Slide');
const TouchCard = require('./models/TouchCard');
const Testimonial = require('./models/Testimonial');
const Update = require('./models/Update');
const Bot = require('./models/Bot');
const Translation = require('./models/Translation');

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
    await Settings.create({
      singleton: 'main',
      earlyRenewalDiscount: 20,
      earlyRenewalWindowDays: 7,
      deployerMonthlyPriceUSD: 10,
      botDeploymentPriceUSD: 5,
      coinsRequiredPerDeploy: 50,
      coinsPerReferral: 2,
      // Free Bot section starts OFF with no link — admin turns it on once a real
      // WhatsApp link (or any URL) is set, from Admin Panel -> Settings.
      freeBot: { enabled: false, whatsappLink: '' },
      // Manual payment starts ON by default with placeholder numbers, so the option
      // is visible immediately — admin should replace these with real numbers.
      manualPayment: {
        enabled: true,
        instructions: "Send payment to any of the numbers below, then screenshot and send proof to our WhatsApp.",
        numbers: [
          { label: 'Ahmed — M-Pesa / Airtel', number: '+255 XXX XXX XXX' },
          { label: 'Adevos-X Official — Tigo Pesa', number: '+255 YYY YYY YYY' }
        ]
      },
      // Social links start empty on purpose — the public site hides any icon whose
      // link is empty, so nothing "dead" is shown until admin fills these in.
      socialLinks: { twitter: '', whatsapp: '', youtube: '', facebook: '', instagram: '', telegram: '', tiktok: '' },
      platformLinks: {
        whatsappCommunity: '',
        whatsappChannel: '',
        telegramChannel: '',
        whatsappSupportNumber: ''
      }
    });
    console.log('[seed] Default settings created (edit freely from Admin -> Settings)');
  } else {
    console.log('[seed] Settings already exist — left untouched');
  }

  // ---------------------------------------------------------------------
  // Services (only if empty)
  // ---------------------------------------------------------------------
  if ((await Service.countDocuments()) === 0) {
    await Service.insertMany([
      { icon: 'fas fa-code', title: 'Web Development', description: 'Custom websites and web apps built with modern stacks, optimized for speed and scale.', order: 1 },
      { icon: 'fab fa-whatsapp', title: 'WhatsApp Bots', description: 'Powerful automated bots for business, customer service, and entertainment.', order: 2 },
      { icon: 'fas fa-rocket', title: 'Bot Deployment', description: 'Seamless hosting and deployment for your bots with 99% uptime guaranteed.', order: 3 },
      { icon: 'fas fa-brain', title: 'AI Solutions', description: 'Custom AI integrations and solutions to power your next-generation applications.', order: 4 },
      { icon: 'fab fa-telegram-plane', title: 'Telegram Bots', description: 'High-speed Telegram integrations for community management and utilities.', order: 5 },
      { icon: 'fas fa-shield-alt', title: 'Cyber Security', description: 'Protect your digital assets with enterprise-grade security consulting.', order: 6 }
    ]);
    console.log('[seed] Default services created');
  }

  // ---------------------------------------------------------------------
  // Slides (homepage slider) — same 4 slides as the original demo
  // ---------------------------------------------------------------------
  if ((await Slide.countDocuments()) === 0) {
    await Slide.insertMany([
      { title: '24/7 Community Support', image: 'https://files.catbox.moe/ymmyxd.jpg', ctaText: 'Join Now', ctaAction: 'support', layout: 'bottom', order: 1 },
      { title: 'Watch Step-by-Step Tutorials', image: 'https://files.catbox.moe/piggs4.png', ctaText: 'Explore Tutorials', ctaAction: 'tutorials', layout: 'bottom', order: 2 },
      { title: 'Deploy with AV Coins', image: 'https://files.catbox.moe/k5xhot.png', ctaText: 'Learn More', ctaAction: 'coins', layout: 'bottom', order: 3 },
      { title: 'Unlimited Deployment, with Deployer Account', image: 'https://files.catbox.moe/1xssrz.png', ctaText: 'Create Account', ctaAction: 'deployer', layout: 'bottom', order: 4 }
    ]);
    console.log('[seed] Default slides created');
  }

  // ---------------------------------------------------------------------
  // Touch Cards ("Get in touch" section) — the full 8-card set from the demo
  // ---------------------------------------------------------------------
  if ((await TouchCard.countDocuments()) === 0) {
    await TouchCard.insertMany([
      { title: 'Deploy bot', description: 'Launch your customized bot instances in less than 2 minutes smoothly.', image: 'https://files.catbox.moe/0jcrgh.jpg', layout: 'top', cardType: 'deploy', buttonText: 'Deploy Now', order: 1 },
      { title: 'Create Deployer account', description: 'Unlock premium micro-servers and cloud instances tailored to your dashboard.', image: 'https://files.catbox.moe/e7mla3.jpg', layout: 'top', cardType: 'deployer', buttonText: 'Create Account', order: 2 },
      { title: 'Manage your bot', description: 'Scale resources, check process logs, and manage live API states.', image: 'https://files.catbox.moe/3t7zau.jpg', layout: 'top', cardType: 'manage', buttonText: 'Manage Now', order: 3 },
      { title: 'Watch tutorials', description: 'Access our comprehensive step-by-step video tutorials specialized for clear setups and deployment guidance.', image: 'https://files.catbox.moe/piggs4.png', layout: 'top', cardType: 'tutorial', order: 4 },
      { title: 'Send Your Feedback', description: 'Your insights drive our development. Feedback means a direct bridge to our core ecosystem optimizations.', image: 'https://files.catbox.moe/szg57z.jpg', layout: 'top', cardType: 'feedback', order: 5 },
      { title: 'Get support', description: 'We have dedicated WhatsApp and Telegram groups and channels specifically designed to provide support.', image: 'https://files.catbox.moe/tfeilw.jpg', layout: 'top', cardType: 'support', order: 6 },
      { title: 'Meet a Developer', description: 'Meet our Lead Full-Stack Engineer & AI Systems Architect. Get direct custom sessions.', image: 'https://files.catbox.moe/mujnit.jpg', layout: 'top', cardType: 'developer', buttonAction: 'https://wa.me/255XXXXXXXXX', order: 7 },
      { title: 'Updates', description: '', image: 'https://files.catbox.moe/2x1der.jpg', layout: 'top', cardType: 'updates', order: 8 }
    ]);
    console.log('[seed] Default touch cards created');
  }

  // ---------------------------------------------------------------------
  // Testimonials
  // ---------------------------------------------------------------------
  if ((await Testimonial.countDocuments()) === 0) {
    await Testimonial.insertMany([
      { text: 'Adevos-X transformed our business with their WhatsApp bot. Engagement skyrocketed!', author: 'Sarah J., CEO', order: 1 },
      { text: 'The web development team delivered a blazing fast site. Highly recommended.', author: 'Michael T., Founder', order: 2 },
      { text: 'Their AI solutions saved us thousands of hours. Truly futuristic tech.', author: 'Elena R., CTO', order: 3 }
    ]);
    console.log('[seed] Default testimonials created');
  }

  // ---------------------------------------------------------------------
  // Update feed (shown in the "Updates" touch card + toast notifications)
  // ---------------------------------------------------------------------
  if ((await Update.countDocuments()) === 0) {
    await Update.insertMany([
      { text: 'Welcome to the new Adevos-X Tech platform — now running on a real backend!' },
      { text: 'Bot catalog is ready. Deploy your first bot from the Deploy Bot menu.' },
      { text: 'AV Coins referral program is live — share your link and start earning.' }
    ]);
    console.log('[seed] Default update log entries created');
  }

  // ---------------------------------------------------------------------
  // Bot catalog — sample entries so "Deploy Bot" isn't empty; replace images/
  // repos/pair sites with your real bots from Admin -> Bot Catalog.
  // ---------------------------------------------------------------------
  if ((await Bot.countDocuments()) === 0) {
    await Bot.insertMany([
      {
        name: 'ADEVOS-X BOT',
        description: 'The official Adevos-X flagship bot. AI, media, sticker maker, group management and more.',
        image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
        author: 'Ahmed K.',
        githubRepo: 'https://github.com/adevos',
        pairSite: 'https://adevosx.site/pair/adevosx',
        isActive: true
      },
      {
        name: 'ATTASA BOT',
        description: 'Multi-feature WhatsApp bot with AI, media downloader, and game modules.',
        image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
        author: 'Juma Petro',
        githubRepo: 'https://github.com',
        pairSite: 'https://adevosx.site/pair/attasa',
        isActive: true
      }
    ]);
    console.log('[seed] Sample bot catalog created — replace with your real bots in Admin');
  }

  // ---------------------------------------------------------------------
  // Sidebar menu — the full hamburger menu from the original demo, grouped
  // exactly as before (Home, Updates, Bot Deployment, My Account, Tutorials,
  // Feedback, Support, Developer).
  // ---------------------------------------------------------------------
  if ((await SidebarItem.countDocuments()) === 0) {
    await SidebarItem.insertMany([
      { label: 'Dashboard', icon: 'fas fa-th-large', group: 'Home', action: 'scrollTop', order: 1 },
      { label: 'Latest News', icon: 'fas fa-newspaper', group: 'Updates', action: 'navigateUpdates', order: 1 },
      { label: 'Deploy bot', icon: 'fas fa-robot', group: 'Bot Deployment', action: 'openDeployModal', order: 1 },
      { label: 'Manage your bot', icon: 'fas fa-tasks', group: 'Bot Deployment', action: 'openManageBotModal', order: 2 },
      { label: 'My Adevos Coins', icon: 'fas fa-coins', group: 'Bot Deployment', action: 'openCoinsPage', order: 3 },
      { label: 'User Account', icon: 'fas fa-user', group: 'My Account', action: 'openUserAccountPage', order: 1 },
      { label: 'Deployer Account', icon: 'fas fa-user-shield', group: 'My Account', action: 'openDeployerAccountModal', order: 2 },
      { label: 'How to deploy WhatsApp Bot', icon: 'fab fa-whatsapp', group: 'Tutorials', action: 'openTutorialsModal', order: 1 },
      { label: 'How to get Telegram bot', icon: 'fab fa-telegram-plane', group: 'Tutorials', action: 'openTutorialsModal', order: 2 },
      { label: 'How to create Deployer account', icon: 'fas fa-key', group: 'Tutorials', action: 'openTutorialsModal', order: 3 },
      { label: 'How to get a free bot', icon: 'fas fa-gift', group: 'Tutorials', action: 'openTutorialsModal', order: 4 },
      { label: 'Send your feedback', icon: 'fas fa-paper-plane', group: 'Feedback', action: 'openFeedback', order: 1 },
      { label: 'Community', icon: 'fas fa-users', group: 'Support', action: 'openSupport', order: 1 },
      { label: 'WhatsApp channel', icon: 'fab fa-whatsapp', group: 'Support', action: 'openSupport', order: 2 },
      { label: 'Telegram channel', icon: 'fab fa-telegram-plane', group: 'Support', action: 'openSupport', order: 3 },
      { label: 'Meet a Developer', icon: 'fas fa-user-astronaut', group: 'Developer', action: 'openFeedback', order: 1 }
    ]);
    console.log('[seed] Default sidebar menu created');
  }

  // ---------------------------------------------------------------------
  // Translations (i18n) — seeds the handful of strings tagged data-i18n=""
  // on the public site. Add more keys/languages any time from Admin -> Translations.
  // ---------------------------------------------------------------------
  if ((await Translation.countDocuments()) === 0) {
    await Translation.insertMany([
      { key: 'services_title', values: { en: 'Our Services', sw: 'Huduma Zetu', fr: 'Nos Services' } },
      { key: 'services_subtitle', values: { en: '(What we offer)', sw: '(Tunachotoa)', fr: '(Ce que nous offrons)' } },
      { key: 'get_in_touch_title', values: { en: 'Get in touch', sw: 'Wasiliana Nasi', fr: 'Contactez-nous' } },
      { key: 'client_feedback_title', values: { en: 'Client feedback', sw: 'Maoni ya Wateja', fr: 'Avis des clients' } },
      { key: 'stay_connected_title', values: { en: 'Stay Connected', sw: 'Endelea Kuwasiliana', fr: 'Restez Connecté' } },
      { key: 'stay_connected_subtitle', values: { en: 'Follow us and subscribe', sw: 'Tufuate na ujiunge', fr: 'Suivez-nous et abonnez-vous' } },
      { key: 'btn_subscribe', values: { en: 'Subscribe', sw: 'Jiunge', fr: "S'abonner" } }
    ]);
    console.log('[seed] Default translations (en/sw/fr) created');
  }

  console.log('[seed] Done. Start the server with: npm start');
  console.log('[seed] Everything created here can be edited or deleted from the Admin Panel at /admin');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
