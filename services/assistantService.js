const axios = require('axios');
const Settings = require('../models/Settings');

// Default keyword -> reply map. Admin can override any of these via Settings.assistantReplies
// (exposed through the "Platform Links" section of the Admin Panel).
const DEFAULT_REPLIES = {
  deploy:
    "To deploy a bot: open 'Deploy Bot', choose a bot from the catalog, pick a payment method (Paystack, Manual, or AV Coins), then fill in your Owner Name, Number, and Session ID before clicking Deploy.",
  coins:
    'AV Coins are earned by sharing your referral link — each new signup through your link gives you 2 coins. You need 50 coins to deploy a bot without paying.',
  support:
    'You can reach our support team via the WhatsApp Community, WhatsApp Channel, or Telegram Channel listed under the Support menu.',
  payment:
    'We accept Paystack (instant, card/mobile money), Manual payment (M-Pesa/Tigo Pesa with WhatsApp receipt verification), and AV Coins.',
  deployer:
    'A Deployer Account lets you deploy unlimited bots to unlimited numbers for a monthly subscription. You can create one from the "Deployer Account" section.'
};

function keywordMatch(message, replies) {
  const lower = message.toLowerCase();
  for (const keyword of Object.keys(replies)) {
    if (lower.includes(keyword)) {
      return replies[keyword];
    }
  }
  return null;
}

/**
 * Generates a reply for the Adevos Assistant chat widget.
 * Falls back to OpenAI if OPENAI_API_KEY is configured and no keyword matches.
 */
async function getAssistantReply(message) {
  const settings = await Settings.findOne({ singleton: 'main' });
  const customReplies = settings ? Object.fromEntries(settings.assistantReplies) : {};
  const replies = { ...DEFAULT_REPLIES, ...customReplies };

  const matched = keywordMatch(message, replies);
  if (matched) return matched;

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are Adevos Assistant, a helpful support bot for Adevos-X Tech, a bot deployment and web development platform. Keep answers short and friendly.'
            },
            { role: 'user', content: message }
          ]
        },
        { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
      );
      return response.data.choices[0].message.content;
    } catch (err) {
      // Fall through to the generic fallback below.
    }
  }

  return "I'm not sure about that yet, but you can reach our human support team via the Support menu for further help.";
}

module.exports = { getAssistantReply };
