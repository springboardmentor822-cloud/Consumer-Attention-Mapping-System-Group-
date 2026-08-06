const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(200)
  },
  address: {
    type: DataTypes.TEXT
  },
  store_type: {
    type: DataTypes.ENUM('supermarket', 'retail', 'mall', 'convenience', 'other'),
    defaultValue: 'retail'
  },
  total_area_sqft: {
    type: DataTypes.FLOAT
  },
  layout_type: {
    type: DataTypes.ENUM('grid', 'racetrack', 'freeform', 'boutique'),
    defaultValue: 'grid'
  },
  manager_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'active'
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
  tableName: 'stores',
  timestamps: false
});

module.exports = Store;
