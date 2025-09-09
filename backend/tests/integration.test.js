const request = require('supertest');
// Definir env ANTES de carregar app/sequelize
process.env.NODE_ENV = 'development';
process.env.SQLITE_STORAGE = require('path').resolve(__dirname, '../database/test-integration.sqlite');
// Importa o app direto para evitar abrir porta nos testes
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const { User, Vehicle, CarGroup } = require('../src/models');

describe('Integração básica', () => {
  let token;
  let vehicleId;
  let reservationId;

  beforeAll(async () => {
    // Reset do banco e seed mínimo (admin, grupo e veículo)
    await sequelize.sync({ force: true });
    await User.create({ name: 'Admin Seed', email: 'admin@locadora.com', password: 'Admin@123', role: 'admin' });
    const group = await CarGroup.create({ code: 'CS', name: 'Econômico Sedan', is_active: true });
    await Vehicle.create({
      brand: 'Marca',
      model: 'Modelo',
      year: new Date().getFullYear(),
      color: 'blue',
      license_plate: 'ADM-0001',
      category: 'sedan',
      daily_rate: 119.9,
      status: 'available',
      group_id: group.id
    });
  });

  it('health ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('login admin seed', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@locadora.com', password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123' });
    expect(res.status).toBe(200);
    token = res.body.data?.token || res.body.token;
    expect(token).toBeTruthy();
  });

  it('lista veículos públicos e pega um id', async () => {
    const res = await request(app).get('/api/public/groups');
    expect(res.status).toBe(200);
    const vRes = await request(app).get('/api/vehicles');
    expect(vRes.status).toBe(200);
    const first = vRes.body.data?.vehicles?.[0] || vRes.body.vehicles?.[0];
    expect(first).toBeTruthy();
    vehicleId = first.id;
  });

  it('cria reserva como admin (simulando cliente) deve falhar sem auth', async () => {
    const res = await request(app).post('/api/reservations').send({ vehicle_id: vehicleId, start_date: new Date(Date.now()+86400000).toISOString(), end_date: new Date(Date.now()+2*86400000).toISOString(), pickup_location: 'Matriz', return_location: 'Matriz' });
    expect(res.status).toBe(401);
  });
});
