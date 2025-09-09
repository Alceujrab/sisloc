require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/config/database');
const PORT = process.env.PORT || 5000;

// Inicializar servidor
async function startServer() {
  try {
    // Testar conexão com banco
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      const isSqlite = sequelize.getDialect && sequelize.getDialect() === 'sqlite';
      if (isSqlite) {
  await sequelize.sync({ force: true });
        console.log('✅ Modelos sincronizados (SQLite DEV force)');
      } else {
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados (alter)');
      }

      // Criar usuário admin padrão se não existir (apenas DEV)
    try {
  const { User, CarGroup, Vehicle, PriceRule } = require('./src/models');
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@locadora.com';
        const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
        const existing = await User.findOne({ where: { email: adminEmail } });
        if (!existing) {
          await User.create({ name: 'Admin', email: adminEmail, password: adminPass, role: 'admin', is_verified: true });
          console.log(`👤 Usuário admin criado: ${adminEmail} / ${adminPass}`);
  }

        // Seed de grupos de carros (mínimo) se vazio
        const groupsCount = await CarGroup.count();
        if (groupsCount === 0) {
          const createdGroups = await CarGroup.bulkCreate([
            {
              code: 'B',
              name: 'Compacto com Ar',
              description: 'Econômico e prático para o dia a dia na cidade.',
              category: 'economico',
              features: ['Ar-condicionado', '4 portas', '5 lugares', 'Bagagem pequena'],
              image_url: '',
              is_active: true
            },
            {
              code: 'CS',
              name: 'Econômico Sedan',
              description: 'Porta-malas maior para quem precisa de espaço extra.',
              category: 'sedan',
              features: ['Ar-condicionado', 'Porta-malas amplo', '5 lugares'],
              image_url: '',
              is_active: true
            },
            {
              code: 'G',
              name: 'SUV Automático',
              description: 'Conforto e posição de dirigir elevada para viagens.',
              category: 'suv',
              features: ['Câmbio automático', '5 lugares', 'Bagagem média'],
              image_url: '',
              is_active: true
            }
          ]);
          console.log('🚗 Grupos de carros seed criados (DEV)');

          // Seed de alguns veículos mínimos para cada grupo
          try {
            const groups = await CarGroup.findAll({ order: [['id','ASC']] });
            const groupByCode = Object.fromEntries(groups.map(g => [g.code, g]));
            const nowYear = new Date().getFullYear();
            await Vehicle.bulkCreate([
              {
                brand: 'Fiat', model: 'Mobi', year: nowYear - 1, color: 'Branco',
                license_plate: 'DEV1A23', category: 'economico', transmission: 'manual', fuel_type: 'flex',
                doors: 4, seats: 5, mileage: 15000, daily_rate: 89.9, insurance_daily: 19.9,
                features: ['Ar-condicionado','Direção hidráulica'], description: 'Econômico e ideal para cidade.',
                images: [], thumbnail: '', status: 'available', location: 'Matriz', is_featured: 1,
                group_id: groupByCode['B']?.id
              },
              {
                brand: 'Chevrolet', model: 'Onix', year: nowYear, color: 'Prata',
                license_plate: 'DEV4B56', category: 'sedan', transmission: 'manual', fuel_type: 'flex',
                doors: 4, seats: 5, mileage: 8000, daily_rate: 119.9, insurance_daily: 24.9,
                features: ['Ar-condicionado','Airbag duplo'], description: 'Sedan econômico com bom porta-malas.',
                images: [], thumbnail: '', status: 'available', location: 'Aeroporto', is_featured: 0,
                group_id: groupByCode['CS']?.id
              },
              {
                brand: 'Hyundai', model: 'Creta', year: nowYear, color: 'Preto',
                license_plate: 'DEV7C89', category: 'suv', transmission: 'automatic', fuel_type: 'flex',
                doors: 4, seats: 5, mileage: 5000, daily_rate: 199.9, insurance_daily: 29.9,
                features: ['Câmbio automático','Central multimídia'], description: 'SUV confortável para viagens.',
                images: [], thumbnail: '', status: 'available', location: 'Matriz', is_featured: 1,
                group_id: groupByCode['G']?.id
              }
            ]);
            console.log('🚙 Veículos seed criados (DEV)');
          } catch (vehErr) {
            console.warn('Não foi possível semear veículos DEV:', vehErr.message);
          }
        }

        // Seed básico de regras de preço (ex.: finais de semana +10%, alta temporada +20 reais)
        try {
          const rulesCount = await PriceRule.count();
          if (rulesCount === 0) {
            await PriceRule.bulkCreate([
              {
                name: 'Finais de Semana +10%',
                description: 'Ajuste de tarifa aos sábados e domingos',
                group_id: null,
                location: null,
                start_date: null,
                end_date: null,
                days_of_week: JSON.stringify([0,6]),
                adjustment_type: 'percent',
                adjustment_value: 10,
                priority: 5,
                is_active: true
              },
              {
                name: 'Alta Temporada Julho +20',
                description: 'Ajuste fixo durante o mês de Julho',
                group_id: null,
                location: null,
                start_date: new Date(`${new Date().getFullYear()}-07-01T00:00:00Z`),
                end_date: new Date(`${new Date().getFullYear()}-07-31T23:59:59Z`),
                days_of_week: null,
                adjustment_type: 'amount',
                adjustment_value: 20,
                priority: 3,
                is_active: true
              }
            ]);
            console.log('💲 Regras de preço seed criadas (DEV)');
          }
        } catch (ruleErr) {
          console.warn('Não foi possível semear regras de preço DEV:', ruleErr.message);
        }
      } catch (seedErr) {
        console.warn('Não foi possível criar admin padrão:', seedErr.message);
      }
    }

    // Não iniciar servidor durante testes
    if (process.env.JEST_WORKER_ID === undefined) {
      app.listen(PORT, () => {
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
