const axios = require('axios');
const nodemailer = require('nodemailer');

let smtpTransport = null;
function getSmtpTransport() {
  if (smtpTransport) return smtpTransport;
  if (!process.env.SMTP_HOST) return null;
  smtpTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  return smtpTransport;
}

/**
 * Sends an email using Resend (preferred, if RESEND_API_KEY is set) or falls back to SMTP.
 */
async function sendEmail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || 'Adevos-X Tech <no-reply@adevosx.tech>';

  if (process.env.RESEND_API_KEY) {
    await axios.post(
      'https://api.resend.com/emails',
      { from, to, subject, html },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } }
    );
    return true;
  }

  const transport = getSmtpTransport();
  if (transport) {
    await transport.sendMail({ from, to, subject, html });
    return true;
  }

  console.warn('[emailService] No RESEND_API_KEY or SMTP config found — email not sent:', subject, 'to', to);
  return false;
}

/**
 * Builds and sends the expiry reminder email (used by the cron job at 7 days and 1 day before expiry).
 */
async function sendExpiryReminder({ to, name, expiryDate, daysLeft, discountPercent }) {
  const discountBlock =
    daysLeft > 1
      ? `<p>Renew now and get <strong>${discountPercent}% off</strong> if you renew within the next ${daysLeft} days!</p>`
      : '';

  const html = `
    <div style="font-family:sans-serif;">
      <h2>Hi ${name},</h2>
      <p>Your Adevos-X subscription/deployer account is expiring on <strong>${expiryDate}</strong> (${daysLeft} day${
    daysLeft === 1 ? '' : 's'
  } left).</p>
      ${discountBlock}
      <p>Renew now to keep your bots online without interruption.</p>
      <p>— Adevos-X Tech</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your Adevos-X subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html
  });
}

module.exports = { sendEmail, sendExpiryReminder };
