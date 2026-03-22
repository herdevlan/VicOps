// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/app_config'); // ← CORREGIDO: app_config
const logger = require('../utils/logger');

// Configuración de Sequelize
const sequelize = new Sequelize(
  config.db.database,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      paranoid: true // Soft deletes
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

// Leer todos los archivos de modelos en este directorio
// Asegurarse de que los nuevos modelos (RefreshToken, AuditLog, etc.) están incluidos
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
    logger.debug(`📦 Modelo cargado: ${model.name}`);
  });

// Establecer asociaciones después de cargar todos los modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
    logger.debug(`🔗 Asociaciones establecidas para: ${modelName}`);
  }
});

// Añadir sequelize y Sequelize al objeto db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Probar conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Conexión a PostgreSQL establecida correctamente');
  } catch (error) {
    logger.error('❌ Error al conectar con PostgreSQL:', { error: error.message });
    throw error;
  }
};

// Ejecutar test de conexión inmediatamente (no bloqueante)
testConnection().catch(err => {
  logger.error('Fallo en conexión inicial a DB:', err.message);
});

module.exports = db;