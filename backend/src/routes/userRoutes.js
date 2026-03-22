// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Todas las rutas de usuarios requieren autenticación
router.use(authMiddleware);

// Rutas para administradores (solo admin puede gestionar usuarios)
router.get('/', 
  roleMiddleware(['Administrador']), 
  userController.validateGetAll(), 
  userController.getAll
);

router.post('/', 
  roleMiddleware(['Administrador']), 
  userController.validateCreate(), 
  userController.create
);

router.get('/:id', 
  roleMiddleware(['Administrador']), 
  userController.validateGetById(), 
  userController.getById
);

router.put('/:id', 
  roleMiddleware(['Administrador']), 
  userController.validateUpdate(), 
  userController.update
);

router.delete('/:id', 
  roleMiddleware(['Administrador']), 
  userController.validateGetById(), 
  userController.delete
);

router.patch('/:id/status', 
  roleMiddleware(['Administrador']), 
  userController.validateGetById(), 
  userController.changeStatus
);

module.exports = router;