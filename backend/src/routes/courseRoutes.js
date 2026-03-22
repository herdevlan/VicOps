// backend/src/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// ============================================
// RUTAS DE CONSULTA
// ============================================

router.get('/', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  courseController.validateGetAll(),
  courseController.getAll
);

router.get('/:id', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  courseController.validateGetById(),
  courseController.getById
);

router.get('/:id/students', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  courseController.validateGetById(),
  courseController.getStudents
);

router.get('/:id/grades', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  courseController.validateGetById(),
  courseController.getGrades
);

router.get('/:id/statistics', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  courseController.validateGetById(),
  courseController.getStatistics
);

router.get('/:id/summary', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  courseController.validateGetById(),
  courseController.getSummary
);

// ============================================
// RUTAS DE ESCRITURA
// ============================================

router.post('/',
  roleMiddleware(['Administrador', 'Director']),
  courseController.validateCreate(),
  courseController.create
);

router.put('/:id',
  roleMiddleware(['Administrador', 'Director']),
  courseController.validateUpdate(),
  courseController.update
);

router.delete('/:id',
  roleMiddleware(['Administrador']),
  courseController.validateGetById(),
  courseController.delete
);

module.exports = router;