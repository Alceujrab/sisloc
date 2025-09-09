const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Ajustes de pontos de fidelidade (earn/redeem/expire/manual)
const LoyaltyAdjustment = sequelize.define('LoyaltyAdjustment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('earn', 'redeem', 'expire', 'manual'), allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false }, // delta positivo (earn) ou negativo (redeem/expire)
  description: { type: DataTypes.STRING(255), allowNull: true },
  reservation_id: { type: DataTypes.INTEGER, allowNull: true },
  payment_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'loyalty_adjustments',
  underscored: true,
  timestamps: true,
  paranoid: true
});

module.exports = LoyaltyAdjustment;
