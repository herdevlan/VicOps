// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { sensitiveLimiter, userCreationLimiter } = require('../middleware/rateLimitMiddleware');

// Todas las rutas de usuarios requieren autenticación
router.use(authMiddleware);

// ============================================
// RUTAS PÚBLICAS DENTRO DEL MÓDULO (requieren auth)
// ============================================

// Cambio de contraseña (usuario autenticado)
router.post('/change-password', 
  sensitiveLimiter,
  userController.validateChangePassword(), 
  userController.changePassword
);

// ============================================
// RUTAS PARA ADMINISTRADORES
// ============================================

// Estadísticas de usuarios (solo admin)
router.get('/statistics', 
  roleMiddleware(['Administrador']), 
  userController.getStatistics
);

// Auditoría de usuarios (solo admin)
router.get('/audit-logs', 
  roleMiddleware(['Administrador']), 
  userController.getAuditLogs
);

// Usuarios recientemente activos (solo admin)
router.get('/recently-active', 
  roleMiddleware(['Administrador']), 
  userController.getRecentlyActive
);

// CRUD completo de usuarios (solo admin)
router.get('/', 
  roleMiddleware(['Administrador']), 
  userController.validateGetAll(), 
  userController.getAll
);

router.get('/:id', 
  roleMiddleware(['Administrador']), 
  userController.validateGetById(), 
  userController.getById
);

router.post('/', 
  roleMiddleware(['Administrador']),
  userCreationLimiter,
  userController.validateCreate(), 
  userController.create
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
  userController.validateChangeStatus(), 
  userController.changeStatus
);

router.post('/:id/reset-password', 
  roleMiddleware(['Administrador']),
  sensitiveLimiter,
  userController.validateResetPassword(), 
  userController.resetPassword
);

module.exports = router;