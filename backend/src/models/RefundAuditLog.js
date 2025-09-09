const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefundAuditLog = sequelize.define('RefundAuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  refund_request_id: { type: DataTypes.INTEGER, allowNull: false },
  actor_user_id: { type: DataTypes.INTEGER, allowNull: false }, // admin/employee que executou
  action: { type: DataTypes.ENUM('created', 'approved', 'rejected', 'processed'), allowNull: false },
  message: { type: DataTypes.STRING(500), allowNull: true }
}, {
  tableName: 'refund_audit_logs',
  underscored: true,
  timestamps: true,
  paranoid: true
});

module.exports = RefundAuditLog;
