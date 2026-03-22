// backend/src/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const config = require('../config/app_config');

// Rate limiter por IP
const createRateLimiter = (windowMinutes, maxRequests, message) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: {
      success: false,
      error: message || `Demasiadas peticiones. Límite: ${maxRequests} por ${windowMinutes} minutos`
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
  });
};

// Rate limiter específico para autenticación
const authLimiter = createRateLimiter(
  config.authRateLimitWindow,
  config.authRateLimitMax,
  `Demasiados intentos de autenticación. Intente nuevamente después de ${config.authRateLimitWindow} minutos`
);

// Rate limiter para API general
const apiLimiter = createRateLimiter(
  config.apiRateLimitWindow,
  config.apiRateLimitMax,
  `Demasiadas peticiones. Límite: ${config.apiRateLimitMax} por segundo`
);

// Rate limiter para endpoints sensibles (cambios de contraseña, etc)
const sensitiveLimiter = createRateLimiter(
  60, // 1 hora
  5,  // 5 intentos por hora
  'Demasiados intentos. Esta operación está limitada por seguridad'
);

// Rate limiter para creación de usuarios
const userCreationLimiter = createRateLimiter(
  60, // 1 hora
  10, // 10 usuarios por hora
  'Demasiados intentos de creación de usuarios. Intente más tarde'
);

module.exports = {
  authLimiter,
  apiLimiter,
  sensitiveLimiter,
  userCreationLimiter
};