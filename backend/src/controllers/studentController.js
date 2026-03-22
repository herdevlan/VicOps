// backend/src/controllers/studentController.js
const BaseController = require('./baseController');
const studentService = require('../services/studentService');
const { body, param, query, validationResult } = require('express-validator');

class StudentController extends BaseController {
  validateGetAll() {
    return [
      query('limit').optional().isInt({ min: 1, max: 100 }),
      query('offset').optional().isInt({ min: 0 }),
      query('search').optional().isString()
    ];
  }

  validateGetById() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero')
    ];
  }

  validateCreate() {
    return [
      body('ci')
        .notEmpty().withMessage('El CI es requerido')
        .isLength({ min: 4, max: 20 }).withMessage('CI debe tener entre 4 y 20 caracteres'),
      body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
      body('apellido')
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres'),
      body('fecha_nacimiento').optional().isDate().withMessage('Fecha inválida'),
      body('telefono').optional().isString(),
      body('email').optional().isEmail().withMessage('Email inválido'),
      body('user_id').optional().isInt().withMessage('user_id debe ser un número')
    ];
  }

  validateUpdate() {
    return [
      param('id').isInt().withMessage('ID debe ser un número entero'),
      body('ci').optional().isLength({ min: 4, max: 20 }),
      body('nombre').optional().isLength({ min: 2, max: 100 }),
      body('apellido').optional().isLength({ min: 2, max: 100 }),
      body('fecha_nacimiento').optional().isDate(),
      body('estado').optional().isBoolean()
    ];
  }

  getAll = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { search, limit, offset } = req.query;
      
      let students;
      if (search) {
        students = await studentService.searchStudents(search);
      } else {
        students = await studentService.getAllStudents();
      }
      
      if (limit) {
        const start = offset ? parseInt(offset) : 0;
        const end = start + parseInt(limit);
        students = students.slice(start, end);
      }
      
      return this.success(res, students);
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
      const student = await studentService.getStudentById(id);
      return this.success(res, student);
    } catch (error) {
      next(error);
    }
  }

  getWithEnrollments = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const student = await studentService.getStudentWithEnrollments(id);
      return this.success(res, student);
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
      
      const student = await studentService.createStudent(req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, student, 'Estudiante creado exitosamente', 201);
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
      
      const student = await studentService.updateStudent(id, req.body, ipAddress, userAgent, requestingUserId);
      return this.success(res, student, 'Estudiante actualizado exitosamente');
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
      
      await studentService.deleteStudent(id, ipAddress, userAgent, requestingUserId);
      return this.success(res, null, 'Estudiante eliminado exitosamente');
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
      const { courseId } = req.query;
      
      const grades = await studentService.getStudentGrades(id, courseId);
      return this.success(res, grades);
    } catch (error) {
      next(error);
    }
  }

  getAverage = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { courseId } = req.query;
      
      const average = await studentService.getStudentAverage(id, courseId);
      return this.success(res, { average });
    } catch (error) {
      next(error);
    }
  }

  getEnrollments = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const { estado } = req.query;
      
      const enrollments = await studentService.getStudentEnrollments(id, estado);
      return this.success(res, enrollments);
    } catch (error) {
      next(error);
    }
  }

  getCompleteHistory = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { id } = req.params;
      const history = await studentService.getStudentCompleteHistory(id);
      return this.success(res, history);
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

      const stats = await studentService.getStudentStatistics();
      return this.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StudentController();