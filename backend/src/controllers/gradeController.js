// backend/src/controllers/gradeController.js
const BaseController = require('./baseController');
const gradeService = require('../services/gradeService');
const { body, param, query, validationResult } = require('express-validator');

class GradeController extends BaseController {
  constructor() {
    super(gradeService);
  }

  validateGetByStudent() {
    return [
      param('studentId').isInt().withMessage('studentId debe ser un número entero'),
      query('courseId').optional().isInt().withMessage('courseId debe ser un número entero')
    ];
  }

  validateGetByCourse() {
    return [
      param('courseId').isInt().withMessage('courseId debe ser un número entero'),
      query('evaluationType').optional().isString().withMessage('evaluationType debe ser texto')
    ];
  }

  validateCreate() {
    return [
      body('student_id').isInt().withMessage('student_id es requerido y debe ser un número'),
      body('course_id').isInt().withMessage('course_id es requerido y debe ser un número'),
      body('nota')
        .isFloat({ min: 0, max: 100 }).withMessage('nota debe ser un número entre 0 y 100')
        .notEmpty().withMessage('nota es requerida'),
      body('tipo_evaluacion')
        .isIn(['primer_parcial', 'segundo_parcial', 'tercer_parcial', 'final', 'trabajo', 'examen', 'recuperatorio'])
        .withMessage('tipo_evaluacion inválido'),
      body('bimestre')
        .optional()
        .isInt({ min: 1, max: 4 }).withMessage('bimestre debe ser entre 1 y 4'),
      body('observacion')
        .optional()
        .isString().withMessage('observacion debe ser texto')
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('nota')
        .optional()
        .isFloat({ min: 0, max: 100 }).withMessage('nota debe ser un número entre 0 y 100'),
      body('observacion')
        .optional()
        .isString().withMessage('observacion debe ser texto')
    ];
  }

  // GET ALL - usando res directamente
  async getAll(req, res, next) {
    try {
      console.log('=== GET ALL GRADES ===');
      const grades = await gradeService.getAllGrades();
      console.log('Grades encontrados:', grades?.length || 0);
      
      return res.status(200).json({
        success: true,
        data: grades || [],
        count: grades?.length || 0
      });
    } catch (error) {
      console.error('Error en getAll grades:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  }

  async getByStudent(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { studentId } = req.params;
      const { courseId } = req.query;
      
      const grades = await gradeService.getStudentGrades(studentId, courseId);
      return res.status(200).json({
        success: true,
        data: grades,
        count: grades.length
      });
    } catch (error) {
      next(error);
    }
  }

  async getByCourse(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { courseId } = req.params;
      const { evaluationType } = req.query;
      
      const grades = await gradeService.getCourseGrades(courseId, evaluationType);
      return res.status(200).json({
        success: true,
        data: grades,
        count: grades.length
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
          errors: errors.array()
        });
      }

      const grade = await gradeService.createGrade(req.body, req.user.id);
      return res.status(201).json({
        success: true,
        message: 'Nota registrada exitosamente',
        data: grade
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
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const grade = await gradeService.updateGrade(id, req.body, req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Nota actualizada exitosamente',
        data: grade
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
          errors: errors.array()
        });
      }

      const { id } = req.params;
      await gradeService.deleteGrade(id);
      return res.status(200).json({
        success: true,
        message: 'Nota eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentAverage(req, res, next) {
    try {
      const { studentId } = req.params;
      const { courseId } = req.query;
      
      const average = await gradeService.getStudentAverage(studentId, courseId);
      return res.status(200).json({
        success: true,
        data: { average }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCourseStatistics(req, res, next) {
    try {
      const { courseId } = req.params;
      const statistics = await gradeService.getCourseStatistics(courseId);
      return res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      next(error);
    }
  }

  async getStudentHistory(req, res, next) {
    try {
      const { studentId } = req.params;
      const { limit } = req.query;
      
      const history = await gradeService.getStudentGradeHistory(studentId, limit || 10);
      return res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopStudents(req, res, next) {
    try {
      const { courseId } = req.params;
      const { limit } = req.query;
      
      const topStudents = await gradeService.getTopStudents(courseId, limit || 5);
      return res.status(200).json({
        success: true,
        data: topStudents
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();