// backend/src/controllers/authController.js
const BaseController = require('./baseController');
const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');

class AuthController extends BaseController {
  // Validación para login
  validateLogin() {
    return [
      body('email')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail()
        .notEmpty().withMessage('El email es requerido'),
      body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    ];
  }

  // Validación para registro
  validateRegister() {
    return [
      body('email')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail()
        .notEmpty().withMessage('El email es requerido'),
      body('password')
        .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
        .notEmpty().withMessage('La contraseña es requerida'),
      body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('apellido')
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
      body('role_id')
        .isInt({ min: 1, max: 4 }).withMessage('Role inválido')
        .optional()
    ];
  }

  // Endpoint login
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(e => e.msg).join(', ');
        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      return res.status(200).json(result);
    } catch (error) {
      if (error.name === 'AuthenticationError') {
        return res.status(401).json({
          success: false,
          error: error.message
        });
      }
      console.error('Error login:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Endpoint register
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMsg = errors.array().map(e => e.msg).join(', ');
        return res.status(400).json({
          success: false,
          error: errorMsg
        });
      }

      const { profileType, profileData, ...userData } = req.body;
      const result = await authService.register(
        userData,
        profileData || {},
        profileType || 'student'
      );

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error register:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  // Endpoint logout
  async logout(req, res, next) {
    try {
      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }

  //  Endpoint me CORREGIDO - SIN DEPENDER DE this.success/error
  async me(req, res, next) {
    try {
      console.log('=== DEBUG me ===');
      console.log('req.user:', req.user);
      
      // Verificar que req.user existe (debería estar después del middleware)
      if (!req.user || !req.user.id) {
        console.log('Usuario no autenticado');
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      console.log('Buscando usuario con ID:', req.user.id);
      
      // Obtener el usuario completo con su rol
      const user = await authService.getUserById(req.user.id);
      
      if (!user) {
        console.log('Usuario no encontrado en BD');
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      console.log('Usuario encontrado:', user.email);
      
      // Devolver la información del usuario
      return res.status(200).json({
        success: true,
        message: 'Perfil obtenido correctamente',
        data: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          ci: user.ci,
          role: user.role
        }
      });
      
    } catch (error) {
      console.error('Error detallado en me:', error);
      console.error('Stack trace:', error.stack);
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  }
}

module.exports = new AuthController();