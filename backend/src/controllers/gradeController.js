// backend/src/controllers/gradeController.js
const BaseController = require('./baseController');
const gradeService = require('../services/gradeService');
const { body, param, query, validationResult } = require('express-validator');

class GradeController extends BaseController {
  validateGetByStudent() {
    return [
      param('studentId').isInt(),
      query('courseId').optional().isInt(),
      query('bimestre').optional().isInt({ min: 1, max: 4 })
    ];
  }

  validateGetByCourse() {
    return [
      param('courseId').isInt(),
      query('evaluationType').optional().isString(),
      query('bimestre').optional().isInt({ min: 1, max: 4 })
    ];
  }

  validateCreate() {
    return [
      body('student_id').isInt().withMessage('student_id es requerido'),
      body('course_id').isInt().withMessage('course_id es requerido'),
      body('nota')
        .isFloat({ min: 0, max: 100 }).withMessage('nota debe ser un número entre 0 y 100')
        .notEmpty(),
      body('tipo_evaluacion')
        .isIn(['primer_parcial', 'segundo_parcial', 'tercer_parcial', 'final', 'trabajo', 'examen', 'recuperatorio'])
        .withMessage('tipo_evaluacion inválido'),
      body('bimestre')
        .optional()
        .isInt({ min: 1, max: 4 }).withMessage('bimestre debe ser entre 1 y 4'),
      body('observacion').optional().isString(),
      body('porcentaje').optional().isInt({ min: 0, max: 100 })
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt(),
      body('nota').optional().isFloat({ min: 0, max: 100 }),
      body('observacion').optional().isString()
    ];
  }

  getByStudent = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { courseId, bimestre } = req.query;
      
      let grades;
      if (bimestre && courseId) {
        grades = await gradeService.getStudentGradesByBimestre(studentId, courseId, bimestre);
      } else {
        grades = await gradeService.getStudentGrades(studentId, courseId);
      }
      
      return this.success(res, grades);
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
      const { evaluationType, bimestre } = req.query;
      
      const grades = await gradeService.getCourseGrades(courseId, evaluationType, bimestre);
      return this.success(res, grades);
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
      
      const grade = await gradeService.createGrade(req.body, req.user.id, ipAddress, userAgent, requestingUserId);
      return this.success(res, grade, 'Nota registrada exitosamente', 201);
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
      
      const grade = await gradeService.updateGrade(id, req.body, req.user.id, ipAddress, userAgent, requestingUserId);
      return this.success(res, grade, 'Nota actualizada exitosamente');
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
      
      await gradeService.deleteGrade(id, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Nota eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  getStudentAverage = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { courseId } = req.query;
      
      const average = await gradeService.getStudentAverage(studentId, courseId);
      return this.success(res, { average });
    } catch (error) {
      next(error);
    }
  }

  getCourseStatistics = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const statistics = await gradeService.getCourseStatistics(courseId);
      return this.success(res, statistics);
    } catch (error) {
      next(error);
    }
  }

  getStudentHistory = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { limit } = req.query;
      
      const history = await gradeService.getStudentGradeHistory(studentId, limit || 10);
      return this.success(res, history);
    } catch (error) {
      next(error);
    }
  }

  getTopStudents = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const { limit } = req.query;
      
      const topStudents = await gradeService.getTopStudents(courseId, limit || 5);
      return this.success(res, topStudents);
    } catch (error) {
      next(error);
    }
  }

  getStudentPerformanceSummary = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const summary = await gradeService.getStudentPerformanceSummary(studentId);
      return this.success(res, summary);
    } catch (error) {
      next(error);
    }
  }

  getCourseGradeMatrix = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const matrix = await gradeService.getCourseGradeMatrix(courseId);
      return this.success(res, matrix);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();