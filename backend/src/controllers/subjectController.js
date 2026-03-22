// backend/src/controllers/subjectController.js
const BaseController = require('./baseController');
const subjectService = require('../services/subjectService');
const { body, param, query, validationResult } = require('express-validator');

class SubjectController extends BaseController {
  validateGetAll() {
    return [
      query('area').optional().isString(),
      query('grado').optional().isInt(),
      query('active').optional().isBoolean()
    ];
  }

  validateGetById() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero')
    ];
  }

  validateCreate() {
    return [
      body('codigo')
        .notEmpty().withMessage('El código es requerido')
        .isLength({ min: 3, max: 20 }).withMessage('Código debe tener entre 3 y 20 caracteres'),
      body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('area_conocimiento').optional().isString(),
      body('horas_academicas').optional().isInt({ min: 1, max: 200 }),
      body('grado').optional().isInt({ min: 1, max: 12 })
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('codigo').optional().isLength({ min: 3, max: 20 }),
      body('nombre').optional().isLength({ min: 2, max: 100 }),
      body('estado').optional().isBoolean()
    ];
  }

  getAll = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { area, grado, active } = req.query;
      
      let subjects;
      if (area) {
        subjects = await subjectService.getSubjectsByArea(area);
      } else if (grado) {
        subjects = await subjectService.getSubjectsByGrado(grado);
      } else if (active === 'true') {
        subjects = await subjectService.getActiveSubjects();
      } else {
        subjects = await subjectService.getAllSubjects();
      }
      
      return this.success(res, subjects);
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
      const subject = await subjectService.getSubjectById(id);
      return this.success(res, subject);
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
      
      const subject = await subjectService.createSubject(req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, subject, 'Materia creada exitosamente', 201);
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
      
      const subject = await subjectService.updateSubject(id, req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, subject, 'Materia actualizada exitosamente');
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
      
      await subjectService.deleteSubject(id, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Materia eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubjectController();