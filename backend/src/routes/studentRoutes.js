// backend/src/routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS DE CONSULTA (múltiples roles)
// ============================================

// Listar estudiantes (docentes, directores, administradores)
router.get('/', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  studentController.validateGetAll(),
  studentController.getAll
);

// Obtener estudiante por ID
router.get('/:id', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  studentController.validateGetById(),
  studentController.getById
);

// Obtener estudiante con inscripciones
router.get('/:id/enrollments', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  studentController.validateGetById(),
  studentController.getWithEnrollments
);

// Obtener calificaciones del estudiante
router.get('/:id/grades', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  studentController.validateGetById(),
  studentController.getGrades
);

// Obtener promedio del estudiante
router.get('/:id/average', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  studentController.validateGetById(),
  studentController.getAverage
);

// Obtener historial académico completo
router.get('/:id/history', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  studentController.validateGetById(),
  studentController.getCompleteHistory
);

// ============================================
// RUTAS DE ESCRITURA (solo administradores y directores)
// ============================================

// Crear estudiante
router.post('/',
  roleMiddleware(['Administrador', 'Director']),
  studentController.validateCreate(),
  studentController.create
);

// Actualizar estudiante
router.put('/:id',
  roleMiddleware(['Administrador', 'Director']),
  studentController.validateUpdate(),
  studentController.update
);

// Eliminar estudiante
router.delete('/:id',
  roleMiddleware(['Administrador']),
  studentController.validateGetById(),
  studentController.delete
);

// Estadísticas de estudiantes (solo administradores)
router.get('/statistics/all',
  roleMiddleware(['Administrador']),
  studentController.getStatistics
);
// Obtener estudiantes con promedio (para dashboard y listado)
router.get('/with-average', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  studentController.getStudentsWithAverage
);

module.exports = router;