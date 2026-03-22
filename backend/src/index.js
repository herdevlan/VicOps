// backend/src/index.js
require('dotenv').config();
const express = require('express');
const config = require('./config/app_config');
const logger = require('./utils/logger');
const securityMiddleware = require('./middleware/securityMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');

// Importar modelos (para conexión DB)
const { sequelize } = require('./models');

const app = express();

// ============================================
// 1. MIDDLEWARES DE SEGURIDAD
// ============================================
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.compression);

// ============================================
// 2. MIDDLEWARES DE PARSING
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 3. MIDDLEWARES DE LOGGING
// ============================================
app.use(loggerMiddleware);

// ============================================
// 4. RATE LIMITING
// ============================================
app.use('/api/', securityMiddleware.limiter);

// ============================================
// 5. RUTAS DE LA API
// ============================================
app.use('/api', routes);

// ============================================
// 6. MANEJO DE ERRORES
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// 7. INICIO DEL SERVIDOR
// ============================================
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Sincronizar modelos SOLO en desarrollo (NO usar en producción)
    if (config.env === 'development') {
      // await sequelize.sync({ alter: true });
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