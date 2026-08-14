require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/db');

// Import routes
require('./models/analytics'); // Import analytics models so they are synced
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/store');
const cameraRoutes = require('./routes/cameras');
const shelfRoutes = require('./routes/shelves');
const productRoutes = require('./routes/products');
const zoneRoutes = require('./routes/zones');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const promotionRoutes = require('./routes/promotions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/products', productRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/promotions', promotionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected successfully using ${sequelize.getDialect()}`);

    const syncOptions = sequelize.getDialect() === 'sqlite'
      ? { force: false, alter: false }
      : { alter: true };

    await sequelize.sync(syncOptions);
    console.log('✅ Database models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;