const path = require('path');
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const isSqlite = process.env.DB_DIALECT === 'sqlite' || process.env.USE_SQLITE === 'true';

const sequelize = isSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || path.resolve(__dirname, '../database/dev.sqlite'),
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'attention_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

module.exports = { sequelize };