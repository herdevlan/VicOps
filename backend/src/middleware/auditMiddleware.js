// backend/src/middleware/auditMiddleware.js
const logger = require('../utils/logger');


// const AuditLog = require('../models/AuditLog');

const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    // Guardar tiempo de inicio
    const startTime = Date.now();
    
    // Interceptar response para loguear después
    const originalSend = res.send;
    let responseBody;
    
    res.send = function(data) {
      responseBody = data;
      originalSend.call(this, data);
    };
    
    // Ejecutar la siguiente middleware
    next();
    
    // Después de que la respuesta se envía
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const auditData = {
        user_id: req.user?.id,
        email: req.user?.email,
        action,
        resource,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
        status_code: res.statusCode,
        duration,
        timestamp: new Date()
      };
      
      // Solo loguear acciones importantes (no GET de listas)
      const shouldLog = 
        action !== 'read' ||
        (action === 'read' && resource === 'sensitive') ||
        res.statusCode >= 400;
      
      if (shouldLog) {
        logger.info(`AUDIT: ${action} ${resource} - Usuario: ${auditData.email || 'anon'} - Status: ${res.statusCode} - ${duration}ms`, auditData);
      }
      
     
      // await AuditLog.create(auditData);
    });
  };
};

module.exports = auditMiddleware;