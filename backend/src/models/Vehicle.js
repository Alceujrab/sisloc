const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1990,
      max: new Date().getFullYear() + 1
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false
  },
  license_plate: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  category: {
    // Ajustado para aceitar categorias seedadas (ex: economico)
    type: DataTypes.STRING,
    allowNull: false
  },
  transmission: {
    type: DataTypes.ENUM('manual', 'automatic'),
    defaultValue: 'manual'
  },
  fuel_type: {
    type: DataTypes.ENUM('gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid'),
    defaultValue: 'flex'
  },
  doors: {
    type: DataTypes.INTEGER,
    validate: {
      min: 2,
      max: 5
    }
  },
  seats: {
    type: DataTypes.INTEGER,
    validate: {
      min: 2,
      max: 9
    }
  },
  mileage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  daily_rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  insurance_daily: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('available', 'rented', 'maintenance', 'inactive'),
    defaultValue: 'available'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'vehicles',
  indexes: [
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['brand'] },
    { fields: ['daily_rate'] },
  { fields: ['is_featured'] },
  // Índices para acelerar mínimos por grupo
  { fields: ['group_id'] },
  { fields: ['group_id', 'status', 'daily_rate'] }
  ]
});

// Método para calcular preço total
Vehicle.prototype.calculateTotalPrice = function(days, includeInsurance = false) {
  let total = this.daily_rate * days;
  if (includeInsurance) {
    total += this.insurance_daily * days;
  }
  return total;
};

module.exports = Vehicle;
