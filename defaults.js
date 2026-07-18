/**
 * DEFAULT / DEMO CONTENT
 * =======================
 * This file is the single source of truth for the "out of the box" content that
 * mirrors the original Adevos-X Tech demo (slides, services, touch cards, sidebar
 * menu, testimonials, sample bots, tutorials, and default settings).
 *
 * It is used in three places:
 *   1. routes/public.js  — if a collection is empty in the database, the public API
 *      falls back to this data so the live site is NEVER blank, even before any
 *      admin has configured anything.
 *   2. routes/admin.js   — the "Load Default Content" action in the Admin Panel
 *      inserts this data into MongoDB as real, editable records.
 *   3. seed.js            — the one-time CLI seed script uses the same data.
 *
 * Items that need a stable identity on the frontend (bots, tutorials, touch cards,
 * slides, testimonials, sidebar items) carry a synthetic `_id` starting with
 * "default-" so client-side code can treat them consistently whether they came
 * from the database or from this fallback. Bots additionally carry
 * `isPlaceholder: true` so the public site shows "Coming Soon" instead of a real
 * (and broken) deploy flow until an admin has added a real bot with a real ID.
 */

const settings = {
  earlyRenewalDiscount: 20,
  earlyRenewalWindowDays: 7,
  deployerMonthlyPriceUSD: 10,
  botDeploymentPriceUSD: 5,
  coinsRequiredPerDeploy: 50,
  coinsPerReferral: 2,
  // Free Bot section starts OFF with no link — admin turns it on once a real
  // WhatsApp link (or any URL) is set, from Admin Panel -> Settings.
  freeBot: { enabled: false, whatsappLink: '' },
  // Manual payment starts ON with placeholder numbers, so the option is visible
  // immediately — admin should replace these with real numbers before going live.
  manualPayment: {
    enabled: true,
    instructions: "Send payment to any of the numbers below, then screenshot and send proof to our WhatsApp.",
    numbers: [
      { label: 'Ahmed — M-Pesa / Airtel', number: '+255 XXX XXX XXX' },
      { label: 'Adevos-X Official — Tigo Pesa', number: '+255 YYY YYY YYY' }
    ]
  },
  // Social links and developer/support contact links start empty on purpose — the
  // public site shows "Coming soon" for any of these until admin fills them in.
  socialLinks: { twitter: '', whatsapp: '', youtube: '', facebook: '', instagram: '', telegram: '', tiktok: '' },
  platformLinks: {
    whatsappCommunity: '',
    whatsappChannel: '',
    telegramChannel: '',
    whatsappSupportNumber: '',
    developerContactLink: ''
  }
};

const slides = [
  { _id: 'default-slide-1', title: '24/7 Community Support', image: 'https://files.catbox.moe/ymmyxd.jpg', ctaText: 'Join Now', ctaAction: 'support', layout: 'bottom', order: 1, isDefault: true },
  { _id: 'default-slide-2', title: 'Watch Step-by-Step Tutorials', image: 'https://files.catbox.moe/piggs4.png', ctaText: 'Explore Tutorials', ctaAction: 'tutorials', layout: 'bottom', order: 2, isDefault: true },
  { _id: 'default-slide-3', title: 'Deploy with AV Coins', image: 'https://files.catbox.moe/k5xhot.png', ctaText: 'Learn More', ctaAction: 'coins', layout: 'bottom', order: 3, isDefault: true },
  { _id: 'default-slide-4', title: 'Unlimited Deployment, with Deployer Account', image: 'https://files.catbox.moe/1xssrz.png', ctaText: 'Create Account', ctaAction: 'deployer', layout: 'bottom', order: 4, isDefault: true }
];

const services = [
  { _id: 'default-service-1', icon: 'fas fa-code', title: 'Web Development', description: 'Custom websites and web apps built with modern stacks, optimized for speed and scale.', order: 1, isDefault: true },
  { _id: 'default-service-2', icon: 'fab fa-whatsapp', title: 'WhatsApp Bots', description: 'Powerful automated bots for business, customer service, and entertainment.', order: 2, isDefault: true },
  { _id: 'default-service-3', icon: 'fas fa-rocket', title: 'Bot Deployment', description: 'Seamless hosting and deployment for your bots with 99% uptime guaranteed.', order: 3, isDefault: true },
  { _id: 'default-service-4', icon: 'fas fa-brain', title: 'AI Solutions', description: 'Custom AI integrations and solutions to power your next-generation applications.', order: 4, isDefault: true },
  { _id: 'default-service-5', icon: 'fab fa-telegram-plane', title: 'Telegram Bots', description: 'High-speed Telegram integrations for community management and utilities.', order: 5, isDefault: true },
  { _id: 'default-service-6', icon: 'fas fa-shield-alt', title: 'Cyber Security', description: 'Protect your digital assets with enterprise-grade security consulting.', order: 6, isDefault: true }
];

// The full 8-card "Get in touch" set — every card type from the original demo,
// including the "Meet a Developer" card.
const touchCards = [
  { _id: 'default-touchcard-1', title: 'Deploy bot', description: 'Launch your customized bot instances in less than 2 minutes smoothly.', image: 'https://files.catbox.moe/0jcrgh.jpg', layout: 'top', cardType: 'deploy', buttonText: 'Deploy Now', order: 1, isDefault: true },
  { _id: 'default-touchcard-2', title: 'Create Deployer account', description: 'Unlock premium micro-servers and cloud instances tailored to your dashboard.', image: 'https://files.catbox.moe/e7mla3.jpg', layout: 'top', cardType: 'deployer', buttonText: 'Create Account', order: 2, isDefault: true },
  { _id: 'default-touchcard-3', title: 'Manage your bot', description: 'Scale resources, check process logs, and manage live API states.', image: 'https://files.catbox.moe/3t7zau.jpg', layout: 'top', cardType: 'manage', buttonText: 'Manage Now', order: 3, isDefault: true },
  { _id: 'default-touchcard-4', title: 'Watch tutorials', description: 'Access our comprehensive step-by-step video tutorials specialized for clear setups and deployment guidance.', image: 'https://files.catbox.moe/piggs4.png', layout: 'top', cardType: 'tutorial', order: 4, isDefault: true },
  { _id: 'default-touchcard-5', title: 'Send Your Feedback', description: 'Your insights drive our development. Feedback means a direct bridge to our core ecosystem optimizations.', image: 'https://files.catbox.moe/szg57z.jpg', layout: 'top', cardType: 'feedback', order: 5, isDefault: true },
  { _id: 'default-touchcard-6', title: 'Get support', description: 'We have dedicated WhatsApp and Telegram groups and channels specifically designed to provide support.', image: 'https://files.catbox.moe/tfeilw.jpg', layout: 'top', cardType: 'support', order: 6, isDefault: true },
  { _id: 'default-touchcard-7', title: 'Meet a Developer', description: 'Meet our Lead Full-Stack Engineer & AI Systems Architect. Get direct custom sessions.', image: 'https://files.catbox.moe/mujnit.jpg', layout: 'top', cardType: 'developer', buttonAction: '', order: 7, isDefault: true },
  { _id: 'default-touchcard-8', title: 'Updates', description: '', image: 'https://files.catbox.moe/2x1der.jpg', layout: 'top', cardType: 'updates', order: 8, isDefault: true }
];

const testimonials = [
  { _id: 'default-testimonial-1', text: 'Adevos-X transformed our business with their WhatsApp bot. Engagement skyrocketed!', author: 'Sarah J., CEO', order: 1, isDefault: true },
  { _id: 'default-testimonial-2', text: 'The web development team delivered a blazing fast site. Highly recommended.', author: 'Michael T., Founder', order: 2, isDefault: true },
  { _id: 'default-testimonial-3', text: 'Their AI solutions saved us thousands of hours. Truly futuristic tech.', author: 'Elena R., CTO', order: 3, isDefault: true }
];

const updates = [
  { _id: 'default-update-1', text: 'Welcome to the new Adevos-X Tech platform — now running on a real backend!', createdAt: new Date().toISOString(), isDefault: true },
  { _id: 'default-update-2', text: 'Bot catalog is ready. Deploy your first bot from the Deploy Bot menu.', createdAt: new Date().toISOString(), isDefault: true },
  { _id: 'default-update-3', text: 'AV Coins referral program is live — share your link and start earning.', createdAt: new Date().toISOString(), isDefault: true }
];

// Placeholder bots — shown on the public site so "Deploy Bot" is never empty, but
// marked isPlaceholder so the Deploy button shows "Coming Soon" instead of trying
// to run a real deployment against a bot that doesn't really exist yet.
const bots = [
  {
    _id: 'default-bot-1',
    name: 'ADEVOS-X BOT',
    description: 'The official Adevos-X flagship bot. AI, media, sticker maker, group management and more.',
    image: 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
    author: 'Adevos-X Team',
    addedDate: new Date().toISOString(),
    githubRepo: '',
    pairSite: '',
    isActive: true,
    isPlaceholder: true,
    isDefault: true
  },
  {
    _id: 'default-bot-2',
    name: 'ATTASA BOT',
    description: 'Multi-feature WhatsApp bot with AI, media downloader, and game modules.',
    image: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg',
    author: 'Adevos-X Team',
    addedDate: new Date().toISOString(),
    githubRepo: '',
    pairSite: '',
    isActive: true,
    isPlaceholder: true,
    isDefault: true
  }
];

// Tutorials with an empty videoUrl already render "No video uploaded yet" on the
// public site, which naturally satisfies "Coming Soon" without extra flags.
const tutorials = [
  { _id: 'default-tutorial-1', title: 'How to deploy WhatsApp Bot', description: 'Step-by-step guide to get your WhatsApp bot live.', icon: 'fab fa-whatsapp', videoUrl: '', order: 1, isDefault: true },
  { _id: 'default-tutorial-2', title: 'How to get Telegram bot', description: 'Setup and deploy your Telegram bot easily.', icon: 'fab fa-telegram-plane', videoUrl: '', order: 2, isDefault: true },
  { _id: 'default-tutorial-3', title: 'How to create Deployer account', description: 'Unlock premium features with a Deployer account.', icon: 'fas fa-key', videoUrl: '', order: 3, isDefault: true },
  { _id: 'default-tutorial-4', title: 'How to get a free bot', description: 'Learn how to claim your free bot today.', icon: 'fas fa-gift', videoUrl: '', order: 4, isDefault: true }
];

// The full hamburger sidebar menu — every group from the original demo.
const sidebarItems = [
  { _id: 'default-sidebar-1', label: 'Dashboard', icon: 'fas fa-th-large', group: 'Home', actionType: 'internal', action: 'scrollTop', order: 1, isDefault: true },
  { _id: 'default-sidebar-2', label: 'Latest News', icon: 'fas fa-newspaper', group: 'Updates', actionType: 'internal', action: 'navigateUpdates', order: 1, isDefault: true },
  { _id: 'default-sidebar-3', label: 'Deploy bot', icon: 'fas fa-robot', group: 'Bot Deployment', actionType: 'internal', action: 'openDeployModal', order: 1, isDefault: true },
  { _id: 'default-sidebar-4', label: 'Manage your bot', icon: 'fas fa-tasks', group: 'Bot Deployment', actionType: 'internal', action: 'openManageBotModal', order: 2, isDefault: true },
  { _id: 'default-sidebar-5', label: 'My Adevos Coins', icon: 'fas fa-coins', group: 'Bot Deployment', actionType: 'internal', action: 'openCoinsPage', order: 3, isDefault: true },
  { _id: 'default-sidebar-6', label: 'User Account', icon: 'fas fa-user', group: 'My Account', actionType: 'internal', action: 'openUserAccountPage', order: 1, isDefault: true },
  { _id: 'default-sidebar-7', label: 'Deployer Account', icon: 'fas fa-user-shield', group: 'My Account', actionType: 'internal', action: 'openDeployerAccountModal', order: 2, isDefault: true },
  { _id: 'default-sidebar-8', label: 'How to deploy WhatsApp Bot', icon: 'fab fa-whatsapp', group: 'Tutorials', actionType: 'internal', action: 'openTutorialsModal', order: 1, isDefault: true },
  { _id: 'default-sidebar-9', label: 'How to get Telegram bot', icon: 'fab fa-telegram-plane', group: 'Tutorials', actionType: 'internal', action: 'openTutorialsModal', order: 2, isDefault: true },
  { _id: 'default-sidebar-10', label: 'How to create Deployer account', icon: 'fas fa-key', group: 'Tutorials', actionType: 'internal', action: 'openTutorialsModal', order: 3, isDefault: true },
  { _id: 'default-sidebar-11', label: 'How to get a free bot', icon: 'fas fa-gift', group: 'Tutorials', actionType: 'internal', action: 'openTutorialsModal', order: 4, isDefault: true },
  { _id: 'default-sidebar-12', label: 'Send your feedback', icon: 'fas fa-paper-plane', group: 'Feedback', actionType: 'internal', action: 'openFeedback', order: 1, isDefault: true },
  { _id: 'default-sidebar-13', label: 'Community', icon: 'fas fa-users', group: 'Support', actionType: 'internal', action: 'openSupport', order: 1, isDefault: true },
  { _id: 'default-sidebar-14', label: 'WhatsApp channel', icon: 'fab fa-whatsapp', group: 'Support', actionType: 'internal', action: 'openSupport', order: 2, isDefault: true },
  { _id: 'default-sidebar-15', label: 'Telegram channel', icon: 'fab fa-telegram-plane', group: 'Support', actionType: 'internal', action: 'openSupport', order: 3, isDefault: true },
  { _id: 'default-sidebar-16', label: 'Meet a Developer', icon: 'fas fa-user-astronaut', group: 'Developer', actionType: 'internal', action: 'openFeedback', order: 1, isDefault: true }
];

const translations = [
  { key: 'services_title', values: { en: 'Our Services', sw: 'Huduma Zetu', fr: 'Nos Services' } },
  { key: 'services_subtitle', values: { en: '(What we offer)', sw: '(Tunachotoa)', fr: '(Ce que nous offrons)' } },
  { key: 'get_in_touch_title', values: { en: 'Get in touch', sw: 'Wasiliana Nasi', fr: 'Contactez-nous' } },
  { key: 'client_feedback_title', values: { en: 'Client feedback', sw: 'Maoni ya Wateja', fr: 'Avis des clients' } },
  { key: 'stay_connected_title', values: { en: 'Stay Connected', sw: 'Endelea Kuwasiliana', fr: 'Restez Connecté' } },
  { key: 'stay_connected_subtitle', values: { en: 'Follow us and subscribe', sw: 'Tufuate na ujiunge', fr: 'Suivez-nous et abonnez-vous' } },
  { key: 'btn_subscribe', values: { en: 'Subscribe', sw: 'Jiunge', fr: "S'abonner" } }
];

// Strips the synthetic default fields (_id, isDefault, isPlaceholder) before
// inserting into MongoDB, since Mongo will generate its own real ObjectId.
function stripDefaultFlags(item) {
  const { _id, isDefault, ...rest } = item;
  return rest;
}

module.exports = {
  settings,
  slides,
  services,
  touchCards,
  testimonials,
  updates,
  bots,
  tutorials,
  sidebarItems,
  translations,
  stripDefaultFlags
};
