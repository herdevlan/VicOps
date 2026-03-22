//backend/src/routes/gradeRoutes.js

const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Todas las rutas de notas requieren autenticación
router.use(authMiddleware);

//  Ruta GET básica para listar todas las notas
router.get('/',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getAll
);

// Rutas de consulta
router.get('/student/:studentId', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getByStudent
);

router.get('/course/:courseId', 
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.validateGetByCourse(),
  gradeController.getByCourse
);

router.get('/student/:studentId/average',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getStudentAverage
);

router.get('/course/:courseId/statistics',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getCourseStatistics
);

router.get('/student/:studentId/history',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  gradeController.validateGetByStudent(),
  gradeController.getStudentHistory
);

router.get('/course/:courseId/top',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  gradeController.getTopStudents
);

// Rutas de escritura
router.post('/',
  roleMiddleware(['Administrador', 'Docente']),
  gradeController.validateCreate(),
  gradeController.create
);

router.put('/:id',
  roleMiddleware(['Administrador', 'Docente']),
  gradeController.validateUpdate(),
  gradeController.update
);

router.delete('/:id',
  roleMiddleware(['Administrador']),
  gradeController.validateUpdate(),
  gradeController.delete
);

module.exports = router;