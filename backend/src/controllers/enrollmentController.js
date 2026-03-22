// backend/src/controllers/enrollmentController.js
const BaseController = require('./baseController');
const enrollmentService = require('../services/enrollmentService');
const { body, param, query, validationResult } = require('express-validator');

class EnrollmentController extends BaseController {
  validateGetByStudent() {
    return [
      param('studentId').isInt(),
      query('estado').optional().isString()
    ];
  }

  validateGetByCourse() {
    return [
      param('courseId').isInt(),
      query('estado').optional().isString()
    ];
  }

  validateCreate() {
    return [
      body('student_id').isInt().withMessage('student_id es requerido'),
      body('course_id').isInt().withMessage('course_id es requerido')
    ];
  }

  validateUpdateStatus() {
    return [
      param('id').isInt(),
      body('estado')
        .isIn(['activo', 'retirado', 'aprobado', 'reprobado', 'trasladado'])
        .withMessage('Estado inválido'),
      body('fecha_retiro').optional().isDate()
    ];
  }

  validateBulkEnroll() {
    return [
      param('courseId').isInt(),
      body('studentIds').isArray().withMessage('studentIds debe ser un array')
    ];
  }

  getByStudent = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { estado } = req.query;
      
      const enrollments = await enrollmentService.getStudentEnrollments(studentId, estado);
      return this.success(res, enrollments);
    } catch (error) {
      next(error);
    }
  }

  getByCourse = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const { estado } = req.query;
      
      const enrollments = await enrollmentService.getCourseEnrollments(courseId, estado);
      return this.success(res, enrollments);
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
      
      const enrollment = await enrollmentService.createEnrollment(req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, enrollment, 'Inscripción creada exitosamente', 201);
    } catch (error) {
      next(error);
    }
  }

  updateStatus = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { estado, fecha_retiro } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      const enrollment = await enrollmentService.updateEnrollmentStatus(
        id, estado, fecha_retiro, ipAddress, userAgent, requestingUserId
      );
      return this.success(res, enrollment, 'Estado actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  getCourseStats = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const stats = await enrollmentService.getCourseEnrollmentStats(courseId);
      return this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  getReport = async (req, res, next) => {
    try {
      const { gestion, grado } = req.query;
      const report = await enrollmentService.getEnrollmentReport(gestion, grado);
      return this.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  bulkEnroll = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const { studentIds } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const requestingUserId = req.user.id;
      
      const result = await enrollmentService.bulkEnrollStudents(
        courseId, studentIds, ipAddress, userAgent, requestingUserId
      );
      return this.success(res, result, `Inscripción masiva completada: ${result.created} estudiantes inscritos`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnrollmentController();