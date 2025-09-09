const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'reservations',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'BRL'
  },
  payment_method: {
    type: DataTypes.ENUM('credit_card', 'debit_card', 'pix', 'bank_transfer', 'cash'),
    allowNull: false
  },
  payment_channel: {
    type: DataTypes.ENUM('online', 'manual'),
    defaultValue: 'online'
  },
  payment_gateway: {
    type: DataTypes.STRING,
    defaultValue: 'stripe'
  },
  gateway_transaction_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gateway_payment_intent: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'),
    defaultValue: 'pending'
  },
  payer_name: { type: DataTypes.STRING, allowNull: true },
  payer_document: { type: DataTypes.STRING, allowNull: true },
  payer_email: { type: DataTypes.STRING, allowNull: true },
  payer_phone: { type: DataTypes.STRING, allowNull: true },
  receipt_url: { type: DataTypes.STRING, allowNull: true },
  details: { type: DataTypes.JSON, allowNull: true },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  gateway_response: {
    type: DataTypes.JSON,
    allowNull: true
  },
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'payments',
  indexes: [
    { fields: ['reservation_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['payment_method'] },
    { fields: ['gateway_transaction_id'] },
    { fields: ['payment_date'] }
  ]
});

module.exports = Payment;
