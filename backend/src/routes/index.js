// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Importar módulos de rutas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const studentRoutes = require('./studentRoutes');
const subjectRoutes = require('./subjectRoutes');
const courseRoutes = require('./courseRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const gradeRoutes = require('./gradeRoutes');
const reportRoutes = require('./reportRoutes');

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '2.0.0'
  });
});

// Ruta de información del sistema
router.get('/info', (req, res) => {
  res.json({
    name: 'Sistema de Monitoreo Académico',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      students: '/api/students',
      subjects: '/api/subjects',
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      grades: '/api/grades',
      reports: '/api/reports'
    }
  });
});

// Montar rutas por módulo
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/students', studentRoutes);
router.use('/subjects', subjectRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/grades', gradeRoutes);
router.use('/reports', reportRoutes);

module.exports = router;