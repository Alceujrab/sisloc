const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BusinessLead = sequelize.define('BusinessLead', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  company: { type: DataTypes.STRING, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'new' },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  deleted_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'business_leads',
  underscored: true,
  paranoid: true,
});

module.exports = BusinessLead;
