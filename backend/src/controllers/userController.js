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

  async getAll(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(e => e.msg).join(', ')
        });
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
      
      // Aplicar paginación simple si se especifica
      if (limit) {
        const start = offset ? parseInt(offset) : 0;
        const end = start + parseInt(limit);
        users = users.slice(start, end);
      }
      
      return res.status(200).json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Error en getAll users:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(e => e.msg).join(', ')
        });
      }

      const { id } = req.params;
      const user = await userService.getUserById(id);
      return res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(e => e.msg).join(', ')
        });
      }

      const user = await userService.createUser(req.body);
      return res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(e => e.msg).join(', ')
        });
      }

      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: errors.array().map(e => e.msg).join(', ')
        });
      }

      const { id } = req.params;
      await userService.deleteUser(id);
      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      
      if (estado === undefined) {
        return res.status(400).json({
          success: false,
          error: 'El campo estado es requerido'
        });
      }
      
      const user = await userService.changeUserStatus(id, estado);
      return res.status(200).json({
        success: true,
        message: `Usuario ${estado ? 'activado' : 'desactivado'} exitosamente`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();