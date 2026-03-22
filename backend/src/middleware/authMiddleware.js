// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const config = require('../config/app_config');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Token no provisto'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Buscar usuario en base de datos con su rol
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    if (!user.estado) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo'
      });
    }

    // Adjuntar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      ci: user.ci,
      role_id: user.role_id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    console.error('Error en auth middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = authMiddleware;