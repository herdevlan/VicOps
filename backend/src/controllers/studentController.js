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

      const { ci, nombre, apellido, fecha_nacimiento, telefono, email, tutor_nombre, tutor_telefono } = req.body;
      
      console.log('=== CREAR ESTUDIANTE ===');
      console.log('Datos:', { ci, nombre, apellido, fecha_nacimiento, telefono, email, tutor_nombre, tutor_telefono });
      
      // Validar campos obligatorios
      if (!ci || !nombre || !apellido) {
        return res.status(400).json({
          success: false,
          error: 'Los campos CI, Nombre y Apellido son obligatorios'
        });
      }
      
      const { sequelize } = require('../models');
      
      // Verificar si ya existe un estudiante con el mismo CI
      const existing = await sequelize.query(`
        SELECT id FROM students WHERE ci = :ci
      `, {
        replacements: { ci },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe un estudiante con este CI'
        });
      }
      
      // Insertar nuevo estudiante
      await sequelize.query(`
        INSERT INTO students 
        (ci, nombre, apellido, fecha_nacimiento, telefono, email, tutor_nombre, tutor_telefono, estado, created_at, updated_at)
        VALUES (:ci, :nombre, :apellido, :fecha_nacimiento, :telefono, :email, :tutor_nombre, :tutor_telefono, true, NOW(), NOW())
      `, {
        replacements: {
          ci,
          nombre,
          apellido,
          fecha_nacimiento: fecha_nacimiento || null,
          telefono: telefono || null,
          email: email || null,
          tutor_nombre: tutor_nombre || null,
          tutor_telefono: tutor_telefono || null
        }
      });
      
      // Obtener el estudiante recién creado
      const newStudent = await sequelize.query(`
        SELECT * FROM students WHERE ci = :ci ORDER BY id DESC LIMIT 1
      `, {
        replacements: { ci },
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('✅ Estudiante creado:', newStudent[0]);
      
      return this.success(res, newStudent[0], 'Estudiante creado exitosamente', 201);
      
    } catch (error) {
      console.error('❌ Error en create estudiante:', error);
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

  // NUEVO MÉTODO: Obtener estudiantes con su promedio
  getStudentsWithAverage = async (req, res, next) => {
    try {
      const { sequelize } = require('../models');
      
      const students = await sequelize.query(`
        SELECT 
          s.id,
          s.ci,
          s.nombre,
          s.apellido,
          COALESCE(AVG(g.nota), 0) as promedio
        FROM students s
        LEFT JOIN grades g ON g.student_id = s.id
        WHERE s.estado = true
        GROUP BY s.id
        ORDER BY promedio DESC, s.apellido ASC
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      
      return this.success(res, students);
    } catch (error) {
      console.error('Error en getStudentsWithAverage:', error);
      next(error);
    }
  }
}

module.exports = new StudentController();