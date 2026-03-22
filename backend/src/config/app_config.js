// backend/src/config/app.config.js
require('dotenv').config();

// Variables críticas que deben existir 
const requiredVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'DB_USER',
  'DB_PASSWORD',
  'DB_DATABASE'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`❌ Faltan variables de entorno necesarias: ${missingVars.join(', ')}`);
}

module.exports = {
  // Servidor
  port: parseInt(process.env.PORT),
  env: process.env.NODE_ENV,
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL,
  
  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  
  // Rate limiting general
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX),
  
  // Rate limiting para autenticación
  authRateLimitWindow: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX),
  
  // Rate limiting para API
  apiRateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW),
  apiRateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX),
  
  // Seguridad
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS),
  sessionSecret: process.env.SESSION_SECRET,
  
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