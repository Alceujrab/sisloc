const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserDocument = sequelize.define('UserDocument', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('cnh', 'address_proof'), allowNull: false },
  file_url: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending','approved','rejected'), defaultValue: 'pending' },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'user_documents',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['status'] }
  ]
});

module.exports = UserDocument;
