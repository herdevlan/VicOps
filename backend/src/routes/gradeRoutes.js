// backend/src/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// ============================================
// RUTAS DE CONSULTA
// ============================================

// Obtener notas por estudiante
router.get('/student/:studentId', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getByStudent
);

// Obtener notas por curso
router.get('/course/:courseId', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.validateGetByCourse(),
  gradeController.getByCourse
);

// Obtener promedio del estudiante
router.get('/student/:studentId/average',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getStudentAverage
);

// Estadísticas del curso
router.get('/course/:courseId/statistics',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getCourseStatistics
);

// Historial de notas del estudiante
router.get('/student/:studentId/history',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getStudentHistory
);

// Top estudiantes del curso
router.get('/course/:courseId/top',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getTopStudents
);

// Resumen de rendimiento del estudiante
router.get('/student/:studentId/performance',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getStudentPerformanceSummary
);

// Matriz de notas del curso
router.get('/course/:courseId/matrix',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getCourseGradeMatrix
);

// ============================================
// RUTAS DE ESCRITURA
// ============================================

// Crear nota (docentes y administradores)
router.post('/',
  roleMiddleware(['Administrador', 'Docente']),
  gradeController.validateCreate(),
  gradeController.create
);

// Actualizar nota
router.put('/:id',
  roleMiddleware(['Administrador', 'Docente']),
  gradeController.validateUpdate(),
  gradeController.update
);

// Eliminar nota (solo administradores)
router.delete('/:id',
  roleMiddleware(['Administrador']),
  gradeController.validateUpdate(),
  gradeController.delete
);

module.exports = router;