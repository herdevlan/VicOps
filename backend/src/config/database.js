// backend/src/config/database.js
require('dotenv').config();
const appConfig = require('./app_config');

module.exports = {
  development: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.database,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'postgres',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true
    }
  },
  test: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: process.env.DB_DATABASE_TEST,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.database,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};