// Script para testar envio SMTP usando util/email
require('dotenv').config();
const { sendEmail, verifyEmailTransport } = require('../utils/email');

(async () => {
  console.log('SMTP_HOST=%s SMTP_PORT=%s SECURE=%s', process.env.SMTP_HOST || process.env.SMTP_SERVICE || '(service)', process.env.SMTP_PORT, process.env.SMTP_SECURE);
  const verify = await verifyEmailTransport();
  console.log('[SMTP VERIFY]', verify);
  if (!verify.ok) {
    console.log('Dicas: ajuste SMTP_SECURE=true para porta 465; SMTP_TLS_REJECT_UNAUTHORIZED=false se houver TLS autoassinado.');
  }
  const to = process.env.TEST_SMTP_TO || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!to) {
    console.error('Defina TEST_SMTP_TO ou SMTP_FROM/SMTP_USER nas variáveis de ambiente.');
    process.exit(1);
  }
  const subject = `Teste SMTP - ${new Date().toISOString()}`;
  const html = `<p>Teste de envio SMTP do sistema Locadora em ${new Date().toLocaleString()}.</p>`;
  const res = await sendEmail({ to, subject, html, text: 'Teste SMTP' });
  console.log('[SMTP TEST RESULT]', res);
})();
