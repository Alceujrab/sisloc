const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Regras de preço sazonais/finais de semana/locais/grupo
// Aplica ajustes percentuais (+/-) ou em valor fixo ao valor da diária
// Filtros: por grupo (group_id), por localização (string do veículo.location),
// por intervalo de datas (start_date/end_date), e por dias da semana (0=Dom,...,6=Sáb)
const PriceRule = sequelize.define('PriceRule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  group_id: { type: DataTypes.INTEGER, allowNull: true },
  location: { type: DataTypes.STRING, allowNull: true },
  start_date: { type: DataTypes.DATE, allowNull: true },
  end_date: { type: DataTypes.DATE, allowNull: true },
  days_of_week: { type: DataTypes.TEXT, allowNull: true }, // JSON string de array de inteiros [0..6]
  adjustment_type: { type: DataTypes.ENUM('percent', 'amount'), allowNull: false, defaultValue: 'percent' },
  adjustment_value: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 }, // p.ex. 10 (10%) ou 15 (R$15)
  priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'price_rules',
  indexes: [
    { fields: ['group_id'] },
    { fields: ['location'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['is_active'] },
    { fields: ['priority'] }
  ]
});

module.exports = PriceRule;
