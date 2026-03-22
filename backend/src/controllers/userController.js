// backend/src/controllers/userController.js
const BaseController = require('./baseController');
const userService = require('../services/userService');
const { body, param, query, validationResult } = require('express-validator');

class UserController extends BaseController {
  validateGetAll() {
    return [
      query('role_id').optional().isInt().withMessage('role_id debe ser un número'),
      query('estado').optional().isBoolean().withMessage('estado debe ser true/false'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe ser entre 1 y 100'),
      query('offset').optional().isInt({ min: 0 }).withMessage('offset debe ser mayor o igual a 0')
    ];
  }

  validateGetById() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero')
    ];
  }

  validateCreate() {
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
        .isInt({ min: 1, max: 4 }).withMessage('role_id debe ser 1-4')
        .notEmpty().withMessage('El role_id es requerido'),
      body('ci')
        .optional()
        .isLength({ min: 4, max: 20 }).withMessage('CI debe tener entre 4 y 20 caracteres')
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('email')
        .optional()
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      body('nombre')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('apellido')
        .optional()
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
      body('role_id')
        .optional()
        .isInt({ min: 1, max: 4 }).withMessage('role_id debe ser 1-4'),
      body('estado')
        .optional()
        .isBoolean().withMessage('estado debe ser true/false')
    ];
  }

  validateChangePassword() {
    return [
      body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida'),
      body('newPassword')
        .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
        .notEmpty().withMessage('La nueva contraseña es requerida')
    ];
  }

  validateResetPassword() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('newPassword')
        .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
        .notEmpty().withMessage('La nueva contraseña es requerida')
    ];
  }

  validateChangeStatus() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('estado')
        .isBoolean().withMessage('estado debe ser true o false')
        .notEmpty().withMessage('estado es requerido')
    ];
  }

  getAll = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { role_id, estado, limit, offset } = req.query;
      
      let users;
      if (role_id) {
        users = await userService.getUsersByRole(role_id);
      } else if (estado === 'true') {
        users = await userService.getActiveUsers();
      } else {
        users = await userService.getAllUsers();
      }
      
      if (limit) {
        const start = offset ? parseInt(offset) : 0;
        const end = start + parseInt(limit);
        users = users.slice(start, end);
      }
      
      return this.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  getById = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const user = await userService.getUserById(id);
      return this.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  create = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      const user = await userService.createUser(req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, user, 'Usuario creado exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  update = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      const user = await userService.updateUser(id, req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, user, 'Usuario actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  delete = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      await userService.deleteUser(id, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Usuario eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  changeStatus = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { estado } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      const user = await userService.changeUserStatus(id, estado, ipAddress, userAgent, requestingUserId);
      return this.success(res, user, `Usuario ${estado ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      next(error);
    }
  }

  changePassword = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      await userService.changePassword(userId, currentPassword, newPassword, ipAddress, userAgent);
      return this.success(res, null, 'Contraseña actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  resetPassword = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { newPassword } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      await userService.resetPassword(id, newPassword, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Contraseña reseteada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  getStatistics = async (req, res, next) => {
    try {
      const stats = await userService.getStatistics();
      return this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  getAuditLogs = async (req, res, next) => {
    try {
      const { userId, limit } = req.query;
      const logs = await userService.getAuditLogs(userId, limit || 50);
      return this.success(res, logs);
    } catch (error) {
      next(error);
    }
  }

  getRecentlyActive = async (req, res, next) => {
    try {
      const { limit } = req.query;
      const users = await userService.getRecentlyActiveUsers(limit || 10);
      return this.success(res, users);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();