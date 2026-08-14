const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customer_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  visit_date: {
    type: DataTypes.STRING(20)
  },
  entry_time: {
    type: DataTypes.STRING(20)
  },
  exit_time: {
    type: DataTypes.STRING(20)
  },
  dwell_time: {
    type: DataTypes.FLOAT
  },
  purchase_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'No Purchase'
  },
  purchase_amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  transaction_id: {
    type: DataTypes.STRING(50),
    defaultValue: '—'
  },
  store: {
    type: DataTypes.STRING(100)
  },
  zone: {
    type: DataTypes.STRING(100)
  },
  products_viewed: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  products_purchased: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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
  tableName: 'customers',
  timestamps: false
});

module.exports = Customer;
