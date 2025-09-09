const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ContactInfo = sequelize.define('ContactInfo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  whatsapp: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  opening_hours: { type: DataTypes.STRING, allowNull: true },
  map_embed_url: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'contact_info'
});

module.exports = ContactInfo;
