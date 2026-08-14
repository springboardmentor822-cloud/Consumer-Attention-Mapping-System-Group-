const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Tracking Model (Aggregated/Batch tracking sessions)
const Tracking = sequelize.define('Tracking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  track_id: { type: DataTypes.STRING(50) },
  camera_id: { type: DataTypes.STRING(50) },
  zone_id: { type: DataTypes.STRING(50) },
  start_time: { type: DataTypes.DATE },
  end_time: { type: DataTypes.DATE },
  activity: { type: DataTypes.STRING(50) },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'tracking', timestamps: false });

// Heatmap Point Model (Aggregated positional data)
const Heatmap = sequelize.define('Heatmap', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  zone_id: { type: DataTypes.STRING(50) },
  camera_id: { type: DataTypes.STRING(50) },
  x_coord: { type: DataTypes.FLOAT },
  y_coord: { type: DataTypes.FLOAT },
  intensity: { type: DataTypes.FLOAT },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'heatmap_points', timestamps: false });

// Dwell Metric Model
const Dwell = sequelize.define('Dwell', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  zone_id: { type: DataTypes.STRING(50) },
  avg_dwell_time: { type: DataTypes.FLOAT }, // in seconds
  visitor_count: { type: DataTypes.INTEGER },
  date: { type: DataTypes.DATEONLY }
}, { tableName: 'dwell_metrics', timestamps: false });

// Attention Metric Model
const Attention = sequelize.define('Attention', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  shelf_id: { type: DataTypes.STRING(50) },
  product_id: { type: DataTypes.STRING(50) },
  attention_score: { type: DataTypes.FLOAT }, // 0 to 100
  date: { type: DataTypes.DATEONLY }
}, { tableName: 'attention_metrics', timestamps: false });

// Product Interaction Model
const ProductInteraction = sequelize.define('ProductInteraction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.STRING(50) },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  views: { type: DataTypes.INTEGER, defaultValue: 0 },
  pickups: { type: DataTypes.INTEGER, defaultValue: 0 },
  returns: { type: DataTypes.INTEGER, defaultValue: 0 },
  date: { type: DataTypes.DATEONLY }
}, { tableName: 'product_interactions', timestamps: false });

// High-level Analytics/KPI Snapshot Model
const Analytics = sequelize.define('Analytics', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  total_visitors: { type: DataTypes.INTEGER },
  avg_dwell_time: { type: DataTypes.FLOAT },
  conversion_rate: { type: DataTypes.FLOAT },
  sales_revenue: { type: DataTypes.FLOAT },
  date: { type: DataTypes.DATEONLY }
}, { tableName: 'analytics_snapshots', timestamps: false });

// AI Insights Model
const AIInsight = sequelize.define('AIInsight', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  store_id: { type: DataTypes.INTEGER, references: { model: 'stores', key: 'id' } },
  insight_type: { type: DataTypes.STRING(100) }, // e.g., 'bottleneck', 'cross-sell'
  description: { type: DataTypes.TEXT },
  priority: { type: DataTypes.STRING(20), defaultValue: 'medium' },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'ai_insights', timestamps: false });

module.exports = {
  Tracking,
  Heatmap,
  Dwell,
  Attention,
  ProductInteraction,
  Analytics,
  AIInsight
};
