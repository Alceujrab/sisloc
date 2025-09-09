// Script simples para testar envio de WhatsApp via util/whatsapp
require('dotenv').config();
const { sendWhatsApp } = require('../utils/whatsapp');

(async () => {
  const to = process.env.TEST_WHATSAPP_TO || '5511999999999'; // ajuste um número seu em E.164 sem '+' para Meta, ou com DDI para Twilio
  const body = `Teste WhatsApp (${new Date().toISOString()})`;
  try {
    const result = await sendWhatsApp({ to, body });
    console.log('[WHATSAPP TEST RESULT]', result);
  } catch (e) {
    console.error('[WHATSAPP TEST ERROR]', e);
    process.exitCode = 1;
  }
})();
