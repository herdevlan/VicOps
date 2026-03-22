// backend/src/middleware/loggerMiddleware.js
const logger = require('../utils/logger');

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Capturar IP real (considerando proxies)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Registrar inicio de petición
  logger.debug(`➡️ ${req.method} ${req.url}`, { ip });
  
  // Interceptar response para loguear tiempo de respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log según código de estado
    if (statusCode >= 500) {
      logger.error(`❌ ${req.method} ${req.url} - ${statusCode} (${duration}ms)`, { ip });
    } else if (statusCode >= 400) {
      logger.warn(`⚠️ ${req.method} ${req.url} - ${statusCode} (${duration}ms)`, { ip });
    } else {
      logger.info(`✅ ${req.method} ${req.url} - ${statusCode} (${duration}ms)`, { ip });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = loggerMiddleware;