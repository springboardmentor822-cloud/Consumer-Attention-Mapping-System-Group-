const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Camera = sequelize.define('Camera', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  camera_id: {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  camera_type: {
    type: DataTypes.ENUM('fixed', 'ptz', 'dome', 'bullet'),
    defaultValue: 'fixed'
  },
  camera_url: {
    type: DataTypes.STRING(500)
  },
  stream_url: {
    type: DataTypes.STRING(500)
  },
  position_x: {
    type: DataTypes.FLOAT
  },
  position_y: {
    type: DataTypes.FLOAT
  },
  height: {
    type: DataTypes.FLOAT
  },
  angle: {
    type: DataTypes.FLOAT
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  fps: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  resolution: {
    type: DataTypes.STRING(20),
    defaultValue: '640x480'
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
  tableName: 'cameras',
  timestamps: false
});

module.exports = Camera;