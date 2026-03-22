// backend/src/middleware/errorHandler.js
const logger = require('../utils/logger');
const config = require('../config/app_config');

// Manejar errores de Sequelize
const handleSequelizeError = (error) => {
  const errors = {
    SequelizeValidationError: {
      message: 'Error de validación',
      statusCode: 400
    },
    SequelizeUniqueConstraintError: {
      message: 'El registro ya existe',
      statusCode: 409
    },
    SequelizeForeignKeyConstraintError: {
      message: 'Error de integridad referencial',
      statusCode: 400
    },
    SequelizeDatabaseError: {
      message: 'Error en la base de datos',
      statusCode: 500
    }
  };

  const handler = errors[error.name];
  if (handler) {
    return {
      ...handler,
      details: error.errors?.map(e => ({
        field: e.path,
        message: e.message
      }))
    };
  }
  
  return null;
};

// Middleware para errores 404 (rutas no encontradas)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.url}`);
  error.statusCode = 404;
  error.isOperational = true; 
  next(error);
};

// Middleware principal de manejo de errores
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Manejar errores de Sequelize
  const sequelizeError = handleSequelizeError(err);
  if (sequelizeError) {
    return res.status(sequelizeError.statusCode).json({
      success: false,
      error: sequelizeError.message,
      ...(sequelizeError.details && { details: sequelizeError.details }),
      ...(config.env === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de validación de express-validator
  if (err.name === 'ValidationError' && err.array) {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: err.array(),
      ...(config.env === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado'
    });
  }

  //  Manejar específicamente errores 404
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      error: err.message,
      ...(config.env === 'development' && { stack: err.stack })
    });
  }

  // Manejar errores personalizados
  const statusCode = err.statusCode || 500;
  const message = err.isOperational 
    ? err.message 
    : 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(err.details && { details: err.details }),
    ...(err.errorCode && { code: err.errorCode }),
    ...(config.env === 'development' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};