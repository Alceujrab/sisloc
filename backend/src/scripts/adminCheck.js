// Script de verificação rápida de rotas admin (login, dashboard, refunds)
// Uso: node src/scripts/adminCheck.js

const base = process.env.API_BASE || 'http://127.0.0.1:5000/api';

async function main() {
  try {
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@locadora.com', password: 'Admin@123' })
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson?.data?.token) {
      console.error('[ADMIN CHECK] Falha no login', loginJson);
      process.exit(1);
    }
    const token = loginJson.data.token;
    console.log('[ADMIN CHECK] Login OK. Token prefix:', token.substring(0, 16) + '...');

    const headers = { Authorization: 'Bearer ' + token };

    const dashRes = await fetch(base + '/admin/dashboard', { headers });
    const dashJson = await dashRes.json();
    if (!dashRes.ok) {
      console.error('[ADMIN CHECK] Erro dashboard', dashJson);
    } else {
      console.log('[ADMIN CHECK] Stats:', {
        totalVehicles: dashJson?.data?.stats?.totalVehicles,
        totalCustomers: dashJson?.data?.stats?.totalCustomers,
        monthlyReservations: dashJson?.data?.stats?.monthlyReservations,
        monthlyRevenue: dashJson?.data?.stats?.monthlyRevenue
      });
    }

    const refundsRes = await fetch(base + '/admin/refunds', { headers });
    const refundsJson = await refundsRes.json();
    if (!refundsRes.ok) {
      console.error('[ADMIN CHECK] Erro refunds', refundsJson);
    } else {
      const count = (refundsJson?.data?.refunds || refundsJson?.data?.items || []).length;
      console.log('[ADMIN CHECK] Refunds count:', count);
    }

    console.log('\nCredenciais para login manual no painel admin:');
    console.log('Email: admin@locadora.com');
    console.log('Senha: Admin@123');
    console.log('\nAcesse: http://localhost:3001/login');
  } catch (e) {
    console.error('[ADMIN CHECK] Erro inesperado', e);
    process.exit(1);
  }
}

main();
