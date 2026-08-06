const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING(100)
  },
  subcategory: {
    type: DataTypes.STRING(100)
  },
  brand: {
    type: DataTypes.STRING(100)
  },
  price: {
    type: DataTypes.FLOAT
  },
  size: {
    type: DataTypes.STRING(50)
  },
  color: {
    type: DataTypes.STRING(50)
  },
  shelf_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'shelves',
      key: 'id'
    }
  },
  shelf_level: {
    type: DataTypes.INTEGER
  },
  position_x: {
    type: DataTypes.FLOAT
  },
  position_y: {
    type: DataTypes.FLOAT
  },
  product_image_url: {
    type: DataTypes.STRING(500)
  },
  product_image_embedding: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
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
  tableName: 'products',
  timestamps: false
});

module.exports = Product;