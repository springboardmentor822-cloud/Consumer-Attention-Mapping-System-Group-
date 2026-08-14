const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transaction_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  customer_id: {
    type: DataTypes.STRING(50)
  },
  date: {
    type: DataTypes.STRING(20)
  },
  time: {
    type: DataTypes.STRING(20)
  },
  products: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  profit: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  payment_status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Completed'
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
  tableName: 'transactions',
  timestamps: false
});

module.exports = Transaction;
