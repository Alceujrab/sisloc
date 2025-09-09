const request = require('supertest');
process.env.NODE_ENV = 'development';
process.env.SQLITE_STORAGE = require('path').resolve(__dirname, '../database/test-e2e.sqlite');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const { User, Vehicle, Reservation, Payment, RefundRequest, RefundAuditLog, LoyaltyAdjustment, CarGroup } = require('../src/models');

// Pequena ajuda: gerar datas
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate()+days); return d; };

describe('E2E: fluxo de reembolso e fidelidade', () => {
  let adminToken; let customerToken; let customer; let reservation; let payment; let refund;

  beforeAll(async () => {
    process.env.NODE_ENV = 'development';
    process.env.SQLITE_STORAGE = require('path').resolve(__dirname, '../database/test-e2e.sqlite');
    // db em memória sqlite (config já aponta para sqlite dev). Limpar e sincronizar
    await sequelize.sync({ force: true });

    // Criar grupo e veículo
    const group = await CarGroup.create({ code: 'E2E', name: 'Teste E2E', is_active: true });
    const vehicle = await Vehicle.create({
      brand: 'Test',
      model: 'E2E',
      year: new Date().getFullYear(),
      color: 'blue',
      license_plate: `E2E-${Date.now()}`,
      category: 'sedan',
      daily_rate: 100,
      status: 'available',
      group_id: group.id
    });

    // Criar admin e cliente
    const admin = await User.create({ name: 'Admin', email: 'admin+e2e@local.test', password: 'secret123', role: 'admin' });
    customer = await User.create({ name: 'Cliente', email: 'cliente+e2e@local.test', password: 'secret123', role: 'customer' });

    // Login para tokens
  const adminRes = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'secret123' });
  adminToken = adminRes.body?.data?.token || adminRes.body?.token;
  const custRes = await request(app).post('/api/auth/login').send({ email: customer.email, password: 'secret123' });
  customerToken = custRes.body?.data?.token || custRes.body?.token;

    // Criar reserva
    const today = new Date();
    reservation = await Reservation.create({
      reservation_code: `RES-E2E-${Date.now()}`,
      user_id: customer.id,
      vehicle_id: vehicle.id,
      start_date: today,
      end_date: addDays(today, 3),
      pickup_location: 'Matriz',
      return_location: 'Matriz',
      days_count: 3,
      daily_rate: 100,
      subtotal: 300,
      total_amount: 300,
      status: 'confirmed'
    });

    // Criar pagamento manual sucedido
    payment = await Payment.create({
      user_id: customer.id,
      reservation_id: reservation.id,
      payment_method: 'cash',
      payment_channel: 'manual',
      amount: 300,
      status: 'succeeded',
      payment_date: new Date()
    });

    // Ajuste de pontos por sucesso de pagamento (algumas rotas fazem isso; aqui simulamos diretamente)
    await LoyaltyAdjustment.create({ user_id: customer.id, payment_id: payment.id, type: 'earn', points: 30, reason: 'E2E earn' });

    // Solicitação de reembolso pelo cliente
    refund = await RefundRequest.create({ user_id: customer.id, reservation_id: reservation.id, payment_id: payment.id, reason: 'Teste E2E', status: 'pending' });
    await RefundAuditLog.create({ refund_request_id: refund.id, actor_user_id: customer.id, action: 'created', message: 'Cliente abriu reembolso' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('Admin aprova e processa reembolso; payment.refunded e audit trail completo', async () => {
    // Aprovar
    const approve = await request(app)
      .patch(`/api/admin/refunds/${refund.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved', reply_message: 'Aprovado em teste' });
    expect(approve.status).toBe(200);

    // Processar
    const process = await request(app)
      .patch(`/api/admin/refunds/${refund.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processed', refund_amount: 100, reply_message: 'Processado parcialmente' });
    expect(process.status).toBe(200);
    const updated = process.body?.data?.refund;
    expect(updated.status).toBe('processed');
    expect(updated.payment?.status).toBe('refunded');
    expect(Number(updated.payment?.refund_amount||0)).toBeCloseTo(100);

    // Detalhe inclui audit logs
    const detail = await request(app)
      .get(`/api/admin/refunds/${refund.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    const logs = detail.body?.data?.refund?.auditLogs || [];
    expect(Array.isArray(logs)).toBe(true);
    // Pelo menos 2 ações do admin: approved, processed
    const actions = logs.map(l => l.action);
    expect(actions).toEqual(expect.arrayContaining(['approved','processed']));
  });
});
