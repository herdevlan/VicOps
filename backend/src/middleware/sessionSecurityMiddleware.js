// backend/src/middleware/sessionSecurityMiddleware.js
const crypto = require('crypto');
const logger = require('../utils/logger');

// Prevenir session fixation
const sessionFixationProtection = (req, res, next) => {
  if (req.user && !req.session?.createdAt) {
    // Regenerar ID de sesión después de login
    req.session.regenerate((err) => {
      if (err) {
        logger.error('Error regenerando sesión:', err);
        return next(err);
      }
      req.session.createdAt = new Date();
      next();
    });
  } else {
    next();
  }
};

// Detectar cambios de IP/user-agent (para sesiones sensibles)
const detectSessionHijacking = (req, res, next) => {
  if (req.user && req.session) {
    const currentIp = req.ip || req.headers['x-forwarded-for'];
    const currentUserAgent = req.headers['user-agent'];
    
    if (req.session.initialIp && req.session.initialIp !== currentIp) {
      logger.warn(`Posible session hijacking detectado para usuario ${req.user.id}: IP cambió de ${req.session.initialIp} a ${currentIp}`);
      // Opcional: invalidar sesión
      // req.session.destroy();
      // return res.status(401).json({ error: 'Sesión inválida' });
    }
    
    if (req.session.initialUserAgent && req.session.initialUserAgent !== currentUserAgent) {
      logger.warn(`Posible session hijacking detectado para usuario ${req.user.id}: User-Agent cambió`);
    }
    
    // Actualizar información de sesión
    req.session.lastActivity = new Date();
  }
  next();
};

// Generar y validar CSRF token (para formularios)
const csrfProtection = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    
    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      logger.warn(`CSRF token inválido para ${req.method} ${req.url}`);
      return res.status(403).json({ error: 'CSRF token inválido' });
    }
  }
  next();
};

// Generar nuevo CSRF token
const generateCsrfToken = (req, res, next) => {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};

module.exports = {
  sessionFixationProtection,
  detectSessionHijacking,
  csrfProtection,
  generateCsrfToken
};