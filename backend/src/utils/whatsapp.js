// Utilitário de envio de mensagens WhatsApp com múltiplos provedores (Meta Cloud API ou Twilio).
// Fallback para log quando não configurado.
const axios = (() => {
  try { return require('axios'); } catch { return null; }
})();

const twilio = (() => {
  try { return require('twilio'); } catch { return null; }
})();

// --- Helpers de normalização ---
function normalizeNumberRaw(number) {
  if (!number) return null;
  // remove espaços, parênteses e hifens
  return String(number).replace(/\s|\(|\)|-/g, '');
}

function normalizeForMeta(number) {
  // Meta Cloud API espera número E.164 sem o símbolo '+' (ex: 5511999998888)
  const trimmed = normalizeNumberRaw(number);
  if (!trimmed) return null;
  const defaultCountry = (process.env.WHATSAPP_DEFAULT_COUNTRY || '55').replace('+', '');
  const digits = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  return /^\d+$/.test(digits) ? digits : `${defaultCountry}${digits}`;
}

function normalizeForTwilio(number) {
  // Twilio requer o prefixo 'whatsapp:' e número em E.164 com '+'
  const trimmed = normalizeNumberRaw(number);
  if (!trimmed) return null;
  const defaultCountry = process.env.WHATSAPP_DEFAULT_COUNTRY || '+55';
  const withPlus = trimmed.startsWith('+') ? trimmed : `${defaultCountry}${trimmed}`;
  return withPlus.startsWith('whatsapp:') ? withPlus : `whatsapp:${withPlus}`;
}

// --- Provedor: Meta WhatsApp Cloud API ---
async function sendViaMeta({ to, body }) {
  if (!axios) throw new Error('axios não instalado');
  const accessToken = process.env.META_WABA_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_WABA_PHONE_NUMBER_ID; // ID do número no WABA
  if (!accessToken || !phoneNumberId) {
    return { queued: false, reason: 'Meta WhatsApp não configurado' };
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const toMeta = normalizeForMeta(to);
  if (!toMeta) return { queued: false, reason: 'Destino inválido' };

  try {
    const resp = await axios.post(url, {
      messaging_product: 'whatsapp',
      to: toMeta,
      type: 'text',
      text: { body: String(body).slice(0, 4096), preview_url: false }
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: parseInt(process.env.WHATSAPP_HTTP_TIMEOUT_MS || '10000', 10)
    });

    const id = resp?.data?.messages?.[0]?.id || null;
    return { queued: true, id, provider: 'meta' };
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[WHATSAPP META ERROR]', status, data || err.message);
    return { queued: false, reason: 'Meta send failed', status, data };
  }
}

// --- Provedor: Twilio ---
let twilioClient = null;
function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !twilio) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

async function sendViaTwilio({ to, body }) {
  const cli = getTwilioClient();
  const from = process.env.WHATSAPP_FROM; // ex: 'whatsapp:+14155238886' (sandbox)
  const toFormatted = normalizeForTwilio(to);
  if (!cli || !from || !toFormatted) {
    return { queued: false, reason: 'Twilio não configurado' };
  }
  try {
    const msg = await cli.messages.create({ from, to: toFormatted, body });
    return { queued: true, sid: msg.sid, provider: 'twilio' };
  } catch (err) {
    console.error('[WHATSAPP TWILIO ERROR]', err?.message || err);
    return { queued: false, reason: 'Twilio send failed', error: err?.message };
  }
}

// --- API pública ---
async function sendWhatsApp({ to, body }) {
  const provider = (process.env.WHATSAPP_PROVIDER || '').toLowerCase();
  try {
    if (provider === 'meta' || provider === 'facebook' || provider === 'cloud') {
      return await sendViaMeta({ to, body });
    }
    if (provider === 'twilio' || provider === '') {
      // padrão anterior mantém Twilio quando nada é especificado
      return await sendViaTwilio({ to, body });
    }
    // Provider desconhecido: fallback para log
    console.log('[WHATSAPP MOCK] provider inválido:', provider, { to, body });
    return { queued: false, reason: 'Provider inválido' };
  } catch (e) {
    console.error('[WHATSAPP ERROR]', e?.message || e);
    console.log('[WHATSAPP MOCK]', { to, body });
    return { queued: false, reason: 'Erro no envio' };
  }
}

module.exports = { sendWhatsApp };
