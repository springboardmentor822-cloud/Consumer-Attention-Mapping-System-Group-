const { sequelize } = require('./config/db');
const User = require('./models/User');
const Store = require('./models/store');
const Camera = require('./models/camera');
const Shelf = require('./models/shelf');
const Product = require('./models/product');
const Zone = require('./models/zone');
const Promotion = require('./models/promotion');
const Customer = require('./models/customer');
const Transaction = require('./models/transaction');
const { Tracking, Heatmap, Dwell, Attention, ProductInteraction, Analytics, AIInsight } = require('./models/analytics');

async function checkCounts() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully.');

    const models = {
      User, Store, Camera, Shelf, Product, Zone, Promotion, Customer, Transaction,
      Tracking, Heatmap, Dwell, Attention, ProductInteraction, Analytics, AIInsight
    };

    for (const [name, model] of Object.entries(models)) {
      try {
        const count = await model.count();
        console.log(`${name}: ${count}`);
      } catch (err) {
        console.error(`❌ Error counting ${name}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ DB connection failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCounts();
