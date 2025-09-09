const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservation_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  vehicle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  pickup_location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  return_location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pickup_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  return_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  days_count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  insurance_daily: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  extras: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  extras_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  insurance_total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  coupon_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'partial', 'refunded', 'failed'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  checkin_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkout_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkin_mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  checkout_mileage: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fuel_level_checkin: {
    type: DataTypes.ENUM('empty', 'quarter', 'half', 'three_quarters', 'full'),
    allowNull: true
  },
  fuel_level_checkout: {
    type: DataTypes.ENUM('empty', 'quarter', 'half', 'three_quarters', 'full'),
    allowNull: true
  },
  damage_report_checkin: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  damage_report_checkout: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additional_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contract_accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contract_accepted_ip: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contract_signature_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Depósito / Pré-autorização
  deposit_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deposit_amount: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0
  },
  preauth_status: {
    type: DataTypes.ENUM('none','held','released','captured','expired','failed'),
    allowNull: false,
    defaultValue: 'none'
  },
  preauth_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preauth_reference: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'reservations',
  hooks: {
    beforeValidate: (reservation) => {
      // Gerar código de reserva único antes da validação se não existir
      if (!reservation.reservation_code) {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        reservation.reservation_code = `RES${timestamp.slice(-6)}${random}`;
      }
    }
  },
  indexes: [
    { fields: ['user_id'] },
    { fields: ['vehicle_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['start_date'] },
  // Observação: índice de end_date removido para evitar conflito no SQLite em sync({ force: true })
    { fields: ['reservation_code'], unique: true }
  ]
});

module.exports = Reservation;
