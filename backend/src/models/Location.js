const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Location = sequelize.define('Location', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  zipcode: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  map_url: { type: DataTypes.STRING, allowNull: true },
  opening_hours: { type: DataTypes.JSON, defaultValue: [] },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'locations'
});

module.exports = Location;
