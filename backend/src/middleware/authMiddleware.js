// backend/src/middleware/authMiddleware.js
const authService = require('../services/authService');
const { AuthenticationError } = require('../utils/errors');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token no proporcionado');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AuthenticationError('Formato de token inválido. Use: Bearer <token>');
    }

    const token = parts[1];
    
    // Verificar token
    const decoded = authService.verifyAccessToken(token);
    
    if (!decoded) {
      throw new AuthenticationError('Token inválido');
    }

    // Adjuntar usuario al request
    req.user = decoded;
    
    // Log de acceso (opcional, para debugging)
    logger.debug(`Usuario autenticado: ${decoded.email} (ID: ${decoded.id})`);
    
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para verificar si el token está próximo a expirar
const checkTokenExpiry = (thresholdMinutes = 5) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();
    
    const token = authHeader.split(' ')[1];
    try {
      const decoded = authService.verifyAccessToken(token);
      const exp = decoded.exp;
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = exp - now;
      
      if (timeLeft > 0 && timeLeft <= thresholdMinutes * 60) {
        res.setHeader('X-Token-Expiring', 'true');
        res.setHeader('X-Token-Expires-In', timeLeft);
      }
    } catch (error) {
      // Token inválido, continuar
    }
    next();
  };
};

module.exports = authMiddleware;
module.exports.checkTokenExpiry = checkTokenExpiry;