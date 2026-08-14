const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Shelf = sequelize.define('Shelf', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  shelf_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'stores',
      key: 'id'
    }
  },
  shelf_number: {
    type: DataTypes.STRING(20)
  },
  section: {
    type: DataTypes.STRING(50)
  },
  zone: {
    type: DataTypes.STRING(100),
    defaultValue: 'Bakery'
  },
  aisle: {
    type: DataTypes.STRING(20)
  },
  shelf_type: {
    type: DataTypes.ENUM('endcap', 'gondola', 'wall', 'island', 'cooler', 'other'),
    defaultValue: 'gondola'
  },
  position_x: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  position_y: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  width: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  levels: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  level_heights: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  product_categories: {
    type: DataTypes.ARRAY(DataTypes.STRING),
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
  tableName: 'shelves',
  timestamps: false
});

module.exports = Shelf;