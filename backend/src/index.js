// backend/src/index.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const config = require('./config/app_config');
const logger = require('./utils/logger');
const securityMiddleware = require('./middleware/securityMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const routes = require('./routes');

// Importar modelos
const { sequelize } = require('./models');

const app = express();

// ============================================
// 1. CONFIGURACIÓN DE SESSION (para CSRF)
// ============================================
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
}));

// ============================================
// 2. MIDDLEWARES DE SEGURIDAD
// ============================================
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.compression);

// ============================================
// 3. MIDDLEWARES DE PARSING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 4. MIDDLEWARES DE LOGGING
// ============================================
app.use(loggerMiddleware);

// ============================================
// 5. RATE LIMITING GENERAL
// ============================================
app.use('/api/', apiLimiter);

// ============================================
// 6. RUTAS DE LA API
// ============================================
app.use('/api', routes);

// ============================================
// 7. MANEJO DE ERRORES
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// 8. INICIO DEL SERVIDOR
// ============================================
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Sincronizar modelos SOLO en desarrollo
    if (config.env === 'development') {
      await sequelize.sync();
      logger.info('📊 Modelos sincronizados (modo desarrollo)');
    }
    
    // Iniciar servidor
    app.listen(config.port, () => {
      logger.info(`
=========================================
🚀 SISTEMA DE MONITOREO ACADÉMICO - BACKEND
=========================================
📡 Servidor: http://localhost:${config.port}
🔧 Entorno: ${config.env}
📝 API Base: http://localhost:${config.port}/api
❤️  Health: http://localhost:${config.port}/api/health
🔐 Auth: http://localhost:${config.port}/api/auth
=========================================
      `);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', { error: error.message });
    process.exit(1);
  }
};

startServer();

// Manejo de señales de cierre
process.on('SIGINT', async () => {
  logger.info('🔴 Recibida señal SIGINT, cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🔴 Recibida señal SIGTERM, cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});