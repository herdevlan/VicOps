// backend/src/routes/subjectRoutes.js
const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Rutas de consulta (todos los roles autenticados pueden ver materias)
router.get('/', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  subjectController.validateGetAll(),
  subjectController.getAll
);

router.get('/:id', 
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  subjectController.validateGetById(),
  subjectController.getById
);

// Rutas de escritura (solo administradores)
router.post('/',
  roleMiddleware(['Administrador']),
  subjectController.validateCreate(),
  subjectController.create
);

router.put('/:id',
  roleMiddleware(['Administrador']),
  subjectController.validateUpdate(),
  subjectController.update
);

router.delete('/:id',
  roleMiddleware(['Administrador']),
  subjectController.validateGetById(),
  subjectController.delete
);

module.exports = router;