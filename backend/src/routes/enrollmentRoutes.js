// backend/src/routes/enrollmentRoutes.js
const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// ============================================
// RUTAS DE CONSULTA
// ============================================

// Obtener inscripciones por estudiante
router.get('/student/:studentId', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  enrollmentController.validateGetByStudent(),
  enrollmentController.getByStudent
);

// Obtener inscripciones por curso
router.get('/course/:courseId', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  enrollmentController.validateGetByCourse(),
  enrollmentController.getByCourse
);

// Estadísticas de inscripciones por curso
router.get('/course/:courseId/stats', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  enrollmentController.getCourseStats
);

// Reporte general de inscripciones
router.get('/report', 
  roleMiddleware(['Administrador', 'Director']),
  enrollmentController.getReport
);

// ============================================
// RUTAS DE ESCRITURA
// ============================================

// Crear inscripción individual
router.post('/',
  roleMiddleware(['Administrador', 'Director']),
  enrollmentController.validateCreate(),
  enrollmentController.create
);

// Actualizar estado de inscripción
router.patch('/:id/status',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  enrollmentController.validateUpdateStatus(),
  enrollmentController.updateStatus
);

// Inscripción masiva
router.post('/course/:courseId/bulk',
  roleMiddleware(['Administrador', 'Director']),
  enrollmentController.validateBulkEnroll(),
  enrollmentController.bulkEnroll
);

module.exports = router;