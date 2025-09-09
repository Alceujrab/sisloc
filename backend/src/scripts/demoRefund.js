// Script de demonstração: cria usuário (se não existir), faz login, cria reserva,
// registra pagamento manual succeeded e abre solicitação de reembolso.
// Em seguida loga como admin e lista reembolsos para mostrar que entrou.
// Executar: node src/scripts/demoRefund.js

const fetch = global.fetch || require('node-fetch');

const API = process.env.DEMO_API_BASE || 'http://127.0.0.1:5000/api';

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForHealth(maxRetries = 10, delayMs = 500) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await fetch(`${API}/health`);
      if (r.ok) return true;
    } catch (_) {}
    await wait(delayMs);
  }
  return false;
}

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function ensureCustomer() {
  const email = 'cliente.demo@example.com';
  const password = 'Cliente@123';
  const name = 'Cliente Demo';
  // Tentar login primeiro
  let r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  let data = await json(r);
  if (!data.success) {
    // registrar
    r = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    data = await json(r);
  }
  if (!data.success) throw new Error('Falha ao garantir cliente: ' + JSON.stringify(data));
  return { token: data.data.token, user: data.data.user };
}

function futureDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  return d.toISOString().substring(0, 10);
}

async function pickVehicle(token) {
  const r = await fetch(`${API}/vehicles?page=1&limit=5`);
  const data = await json(r);
  if (!data.success || !data.data.vehicles.length) throw new Error('Nenhum veículo disponível');
  return data.data.vehicles[0];
}

async function createReservation(token, vehicle) {
  const start = futureDate(3);
  const end = futureDate(6);
  const payload = {
    vehicle_id: vehicle.id,
    start_date: start,
    end_date: end,
    // Usar localização já existente no seed para reduzir risco de validação
    pickup_location: vehicle.location || 'Matriz',
    return_location: vehicle.location || 'Matriz',
    include_insurance: true,
    extras: ['gps']
  };
  const r = await fetch(`${API}/reservations`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const data = await json(r);
  if (!data.success) throw new Error('Falha reserva: ' + JSON.stringify(data));
  return data.data.reservation;
}

async function manualPayment(token, reservation) {
  const amount = reservation.total_amount;
  const r = await fetch(`${API}/payments/manual`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reservation_id: reservation.id, payment_method: 'pix', amount, status: 'succeeded', payer_name: 'Cliente Demo' })
  });
  const data = await json(r);
  if (!data.success) throw new Error('Falha pagamento: ' + JSON.stringify(data));
  return data.data.payment;
}

async function createRefund(token, reservation, payment) {
  const r = await fetch(`${API}/customers/refunds`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reservation_id: reservation.id, payment_id: payment.id, reason: 'Teste de fluxo de reembolso demo' })
  });
  const data = await json(r);
  if (!data.success) throw new Error('Falha refund: ' + JSON.stringify(data));
  return data.data.refund;
}

async function adminLogin() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@locadora.com', password: 'Admin@123' })
  });
  const data = await json(r);
  if (!data.success) throw new Error('Falha login admin');
  return data.data.token;
}

async function listAdminRefunds(adminToken) {
  const r = await fetch(`${API}/admin/refunds?limit=5`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const data = await json(r);
  if (!data.success) throw new Error('Falha listar refunds admin');
  return data.data.refunds;
}

(async () => {
  try {
  console.log('--- DEMO REEMBOLSO INÍCIO ---');
  const healthy = await waitForHealth();
  if (!healthy) throw new Error('API indisponível /health');
    const { token: customerToken, user } = await ensureCustomer();
    console.log('Cliente OK:', user.email, 'id=', user.id);
    const vehicle = await pickVehicle(customerToken);
    console.log('Veículo escolhido:', vehicle.brand, vehicle.model, 'id=', vehicle.id);
    const reservation = await createReservation(customerToken, vehicle);
    console.log('Reserva criada:', reservation.reservation_code, 'total=', reservation.total_amount);
    const payment = await manualPayment(customerToken, reservation);
    console.log('Pagamento manual registrado status=', payment.status, 'id=', payment.id);
    const refund = await createRefund(customerToken, reservation, payment);
    console.log('Refund aberto status=', refund.status, 'id=', refund.id);
    const adminToken = await adminLogin();
    const refundsAdmin = await listAdminRefunds(adminToken);
    console.log('Admin visualiza primeiros refunds:', refundsAdmin.map(r => ({ id: r.id, status: r.status, payment_id: r.payment_id })));
    console.log('--- DEMO REEMBOLSO FIM ---');
  } catch (e) {
    console.error('Erro na demo:', e && e.stack ? e.stack : (e && e.message) || e);
    process.exitCode = 1;
  }
})();
