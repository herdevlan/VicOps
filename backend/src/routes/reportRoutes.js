// backend/src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Todas las rutas de reportes requieren autenticación
router.use(authMiddleware);

// Dashboard (acceso para directores y administradores)
router.get('/dashboard',
  roleMiddleware(['Administrador', 'Director']),
  reportController.validateGetDashboard(),
  reportController.getDashboardStats
);

// Reporte de estudiante (estudiante puede ver su propio reporte)
router.get('/student/:studentId',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  reportController.validateGetStudentReport(),
  reportController.getStudentReport
);

// Reporte de curso (acceso para docentes, directores y administradores)
router.get('/course/:courseId',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  reportController.validateGetCourseReport(),
  reportController.getCourseReport
);

// Reporte de rendimiento general (acceso para directores y administradores)
router.get('/performance',
  roleMiddleware(['Administrador', 'Director']),
  reportController.validateGetPerformanceReport(),
  reportController.getPerformanceReport
);

// Reporte de docente (acceso para directores y administradores)
router.get('/teacher/:teacherId',
  roleMiddleware(['Administrador', 'Director']),
  reportController.validateGetTeacherReport(),
  reportController.getTeacherReport
);

module.exports = router;