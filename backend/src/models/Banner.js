const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  subtitle: { type: DataTypes.STRING, allowNull: true },
  image_url: { type: DataTypes.STRING, allowNull: false },
  link_url: { type: DataTypes.STRING, allowNull: true },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'banners',
  indexes: [ { fields: ['is_active'] }, { fields: ['position'] } ]
});

module.exports = Banner;
