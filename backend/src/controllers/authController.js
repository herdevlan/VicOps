// backend/src/controllers/authController.js
const BaseController = require('./baseController');
const authService = require('../services/authService');
const { body, validationResult } = require('express-validator');

class AuthController extends BaseController {
  constructor() {
    super(); 
  }

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

  validateRefresh() {
    return [
      body('refreshToken')
        .notEmpty().withMessage('Refresh token es requerido')
    ];
  }

  // Usar arrow functions para mantener el contexto de this
  login = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      const result = await authService.login(email, password, userAgent, ipAddress);
      
      return this.success(res, result, 'Login exitoso');
    } catch (error) {
      next(error);
    }
  }

  refresh = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { refreshToken } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      const result = await authService.refreshAccessToken(refreshToken, userAgent, ipAddress);
      
      return this.success(res, result, 'Token refrescado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken;
      await authService.logout(refreshToken);
      return this.success(res, null, 'Sesión cerrada correctamente');
    } catch (error) {
      next(error);
    }
  }

  logoutAll = async (req, res, next) => {
    try {
      const userId = req.user.id;
      await authService.logoutAll(userId);
      return this.success(res, null, 'Todas las sesiones cerradas correctamente');
    } catch (error) {
      next(error);
    }
  }

  register = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { profileType, profileData, ...userData } = req.body;
      
      const result = await authService.register(
        userData,
        profileData || {},
        profileType || 'student'
      );
      
      return this.success(res, result, 'Registro exitoso', 201);
    } catch (error) {
      next(error);
    }
  }

  me = async (req, res, next) => {
    try {
      const { id } = req.user;
      const user = await authService.getUserById(id);
      return this.success(res, user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();