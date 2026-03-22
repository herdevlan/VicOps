// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar módulos de rutas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const gradeRoutes = require('./gradeRoutes');
const reportRoutes = require('./reportRoutes');

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Ruta de información del sistema
router.get('/info', (req, res) => {
  res.json({
    name: 'Sistema de Monitoreo Académico',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      grades: '/api/grades',
      reports: '/api/reports'
    }
  });
});

// Montar rutas por módulo
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/grades', gradeRoutes);
router.use('/reports', reportRoutes);

module.exports = router;