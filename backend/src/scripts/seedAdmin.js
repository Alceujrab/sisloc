require('dotenv').config();
const { sequelize } = require('../config/database');
const { User } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const email = process.env.ADMIN_EMAIL || 'admin@locadora.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    let admin = await User.findOne({ where: { email } });
    if (!admin) {
      admin = await User.create({ name: 'Administrador', email, password, role: 'admin', is_verified: true });
      console.log('✅ Admin criado:', email);
    } else {
      console.log('ℹ️ Admin já existe:', email);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  }
})();
