// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/login', authController.validateLogin(), authController.login);
router.post('/register', authController.validateRegister(), authController.register);

// Rutas protegidas (requieren autenticación)
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authMiddleware, authController.logout); 

module.exports = router;