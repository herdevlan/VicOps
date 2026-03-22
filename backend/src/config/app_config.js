// backend/src/config/app_config.js
require('dotenv').config();

module.exports = {
  // Servidor
  port: parseInt(process.env.PORT),
  env: process.env.NODE_ENV,
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL,
  
  // Rate limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX),
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  
  // Database
  db: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
  },
  
  // Logs
  logLevel: process.env.LOG_LEVEL,
};