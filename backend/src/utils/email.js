const nodemailer = require('nodemailer');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;

  const service = process.env.SMTP_SERVICE; // opcional (ex.: 'gmail')
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if ((!service && !host) || !user || !pass) return null;

  const secureDefault = port === 465;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : secureDefault;
  const requireTLS = process.env.SMTP_REQUIRE_TLS === 'true';
  const ignoreTLS = process.env.SMTP_IGNORE_TLS === 'true';
  const authMethod = process.env.SMTP_AUTH_METHOD; // 'PLAIN' | 'LOGIN' | 'CRAM-MD5'
  const pool = process.env.SMTP_POOL === 'true';
  const logger = process.env.SMTP_DEBUG === 'true';
  const debug = logger;
  const tls = {};
  if (process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false') tls.rejectUnauthorized = false;

  const base = {
    secure,
    requireTLS,
    ignoreTLS,
    auth: { user, pass, ...(authMethod ? { method: authMethod } : {}) },
    pool,
    logger,
    debug,
    ...(Object.keys(tls).length ? { tls } : {})
  };

  if (service) {
    transporter = nodemailer.createTransport({ service, ...base });
  } else {
    transporter = nodemailer.createTransport({ host, port, ...base });
  }

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL MOCK]', { to, subject });
    return { queued: false, reason: 'No SMTP configured' };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const info = await t.sendMail({ from, to, subject, text, html });
  return { queued: true, messageId: info.messageId };
}

async function verifyEmailTransport() {
  const t = getTransporter();
  if (!t) return { ok: false, reason: 'No SMTP configured' };
  try {
    const ok = await t.verify();
    return { ok };
  } catch (e) {
    return { ok: false, error: e?.message };
  }
}

module.exports = { sendEmail, verifyEmailTransport };
