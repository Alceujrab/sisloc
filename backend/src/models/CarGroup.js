const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CarGroup = sequelize.define('CarGroup', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  // Categoria para organizar seções (ex.: 'economico', 'suv', 'pickup')
  category: { type: DataTypes.STRING, allowNull: true },
  features: { type: DataTypes.JSON, defaultValue: [] },
  image_url: { type: DataTypes.STRING, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'car_groups',
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_active'] },
    { fields: ['category'] }
  ]
});

module.exports = CarGroup;
