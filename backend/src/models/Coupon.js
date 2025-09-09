const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.STRING, allowNull: true },
  discount_type: { type: DataTypes.ENUM('percent', 'amount'), allowNull: false, defaultValue: 'percent' },
  discount_value: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  min_days: { type: DataTypes.INTEGER, allowNull: true },
  max_days: { type: DataTypes.INTEGER, allowNull: true },
  starts_at: { type: DataTypes.DATE, allowNull: true },
  ends_at: { type: DataTypes.DATE, allowNull: true },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'coupons',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_public'] },
    { fields: ['is_active'] }
  ]
});

module.exports = Coupon;
