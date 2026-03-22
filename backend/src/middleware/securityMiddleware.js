// backend/src/middleware/securityMiddleware.js
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const config = require('../config/app_config');

// Configuración CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como Postman) en desarrollo
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Configuración Helmet (seguridad HTTP)
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// Configuración Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000,
  max: config.rateLimitMax,
  message: {
    error: 'Demasiadas peticiones, por favor intente más tarde',
    retryAfter: config.rateLimitWindow
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter específico para autenticación (más restrictivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    error: 'Demasiados intentos de inicio de sesión, intente más tarde'
  },
  skipSuccessfulRequests: true,
});

module.exports = {
  helmetConfig,
  helmet: helmet(helmetConfig),
  cors: cors(corsOptions),
  compression: compression(),
  limiter,
  authLimiter
};