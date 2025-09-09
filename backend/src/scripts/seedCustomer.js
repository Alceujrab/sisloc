require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const email = process.env.DEMO_CUSTOMER_EMAIL || 'cliente@locadora.com';
    const password = process.env.DEMO_CUSTOMER_PASSWORD || 'Cliente@123';

    let customer = await User.findOne({ where: { email } });
    if (!customer) {
      customer = await User.create({
        name: 'Cliente Demo',
        email,
        password,
        role: 'customer',
        is_verified: true,
        status: 'active',
      });
      console.log('✅ Cliente demo criado:', email);
    } else {
      console.log('ℹ️ Cliente demo já existe:', email);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no seed do cliente:', err);
    process.exit(1);
  }
})();
