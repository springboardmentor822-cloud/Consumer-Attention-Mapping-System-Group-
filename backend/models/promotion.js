const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Promotion = sequelize.define('Promotion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  promo_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  zone: {
    type: DataTypes.STRING(100)
  },
  category: {
    type: DataTypes.STRING(100)
  },
  type: {
    type: DataTypes.STRING(50)
  },
  value: {
    type: DataTypes.STRING(50)
  },
  lift: {
    type: DataTypes.STRING(20)
  },
  revenue: {
    type: DataTypes.FLOAT
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active'
  },
  start_date: {
    type: DataTypes.DATEONLY
  },
  end_date: {
    type: DataTypes.DATEONLY
  },
  products: {
    type: sequelize.getDialect() === 'sqlite' ? DataTypes.JSON : DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'promotions',
  timestamps: false
});

module.exports = Promotion;
