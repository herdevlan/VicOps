// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Rutas públicas con rate limiting específico
router.post('/login', authLimiter, authController.validateLogin(), authController.login);
router.post('/refresh', authLimiter, authController.validateRefresh(), authController.refresh);
router.post('/register', authLimiter, authController.validateRegister(), authController.register);

// Rutas protegidas
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
router.get('/me', authMiddleware, authController.me);

module.exports = router;