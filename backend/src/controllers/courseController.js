// backend/src/controllers/courseController.js
const BaseController = require('./baseController');
const courseService = require('../services/courseService');
const { body, param, query, validationResult } = require('express-validator');

class CourseController extends BaseController {
  validateGetAll() {
    return [
      query('gestion').optional().isInt(),
      query('teacherId').optional().isInt(),
      query('subjectId').optional().isInt(),
      query('grado').optional().isInt()
    ];
  }

  validateGetById() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero')
    ];
  }

  validateCreate() {
    return [
      body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('grado')
        .isInt({ min: 1, max: 12 }).withMessage('Grado debe ser entre 1 y 12')
        .notEmpty().withMessage('El grado es requerido'),
      body('paralelo')
        .notEmpty().withMessage('El paralelo es requerido')
        .isLength({ min: 1, max: 10 }).withMessage('El paralelo debe tener entre 1 y 10 caracteres'),
      body('gestion')
        .isInt({ min: 2000, max: 2100 }).withMessage('Gestión debe ser entre 2000 y 2100')
        .notEmpty().withMessage('La gestión es requerida'),
      body('subject_id')
        .isInt().withMessage('subject_id debe ser un número entero')
        .notEmpty().withMessage('El subject_id es requerido'),
      body('teacher_id').optional().isInt().withMessage('teacher_id debe ser un número entero'),
      body('turno')
        .optional()
        .custom((value) => {
          const validValues = ['mañana', 'tarde', 'noche'];
          if (!validValues.includes(value)) {
            throw new Error('Turno debe ser mañana, tarde o noche');
          }
          return true;
        }),
      body('capacidad')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Capacidad debe ser un número entre 1 y 50')
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('nombre').optional().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('estado').optional().isBoolean().withMessage('estado debe ser true o false')
    ];
  }

  getAll = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { gestion, teacherId, subjectId, grado } = req.query;
      
      let courses;
      if (teacherId) {
        courses = await courseService.getCoursesByTeacher(teacherId, gestion);
      } else if (subjectId) {
        courses = await courseService.getCoursesBySubject(subjectId, gestion);
      } else if (gestion) {
        courses = await courseService.getCoursesByYear(gestion);
      } else if (grado && gestion) {
        const allCourses = await courseService.getCoursesByYear(gestion);
        courses = allCourses.filter(c => c.grado == grado);
      } else {
        courses = await courseService.getAllCourses();
      }
      
      return this.success(res, courses);
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
      const course = await courseService.getCourseById(id);
      return this.success(res, course);
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
      
      const course = await courseService.createCourse(req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, course, 'Curso creado exitosamente', 201);
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
      
      const course = await courseService.updateCourse(id, req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, course, 'Curso actualizado exitosamente');
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
      
      await courseService.deleteCourse(id, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Curso eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  getStudents = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const students = await courseService.getCourseStudents(id);
      return this.success(res, students);
    } catch (error) {
      next(error);
    }
  }

  getGrades = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { evaluationType, bimestre } = req.query;
      
      const grades = await courseService.getCourseGrades(id, evaluationType, bimestre);
      return this.success(res, grades);
    } catch (error) {
      next(error);
    }
  }

  getStatistics = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const statistics = await courseService.getCourseStatistics(id);
      return this.success(res, statistics);
    } catch (error) {
      next(error);
    }
  }

  getSummary = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const summary = await courseService.getCourseSummary(id);
      return this.success(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CourseController();