const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefundRequest = sequelize.define('RefundRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'reservations', key: 'id' }
  },
  payment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'payments', key: 'id' }
  },
  reservation_code: { type: DataTypes.STRING, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending','approved','rejected','processed'),
    defaultValue: 'pending'
  },
  reply_message: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'refund_requests',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['reservation_id'] },
    { fields: ['payment_id'] },
    { fields: ['status'] }
  ]
});

module.exports = RefundRequest;
