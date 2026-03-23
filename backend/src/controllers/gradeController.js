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
      body('evaluacion_numero')
        .optional()
        .isInt({ min: 1, max: 6 }).withMessage('evaluacion_numero debe ser entre 1 y 6'),
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

      const { student_id, course_id, nota, tipo_evaluacion, evaluacion_numero } = req.body;
      const user_id = req.user?.id || 1;
      
      console.log('=== GUARDAR NOTA ===');
      console.log('Datos:', { student_id, course_id, nota, tipo_evaluacion, evaluacion_numero, user_id });
      
      // Validar nota
      const notaNum = parseFloat(nota);
      if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'La nota debe ser un número entre 0 y 100'
        });
      }
      
      // Determinar observación según la nota
      let observacion = '';
      if (notaNum >= 85) {
        observacion = '✅ Excelente - Muy buen rendimiento';
      } else if (notaNum >= 70) {
        observacion = '👍 Bueno - Continúa así';
      } else if (notaNum >= 60) {
        observacion = '📚 Suficiente - Puede mejorar';
      } else if (notaNum >= 51) {
        observacion = '⚠️ Aprobado - Necesita reforzar';
      } else {
        observacion = '❌ Reprobado - Requiere reforzamiento inmediato';
      }
      
      console.log('Observación:', observacion);
      
      const { sequelize } = require('../models');
      
      // Verificar si ya existe
      const existing = await sequelize.query(`
        SELECT id FROM grades 
        WHERE student_id = $1 
          AND course_id = $2 
          AND tipo_evaluacion = $3 
          AND (evaluacion_numero = $4 OR (evaluacion_numero IS NULL AND $4 IS NULL))
      `, {
        bind: [student_id, course_id, tipo_evaluacion, evaluacion_numero || null],
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('Ya existe?', existing.length > 0 ? 'SI' : 'NO');
      
      if (existing.length > 0) {
        // Actualizar
        await sequelize.query(`
          UPDATE grades 
          SET nota = $1, 
              user_id = $2,
              observacion = $3,
              updated_at = NOW()
          WHERE student_id = $4 
            AND course_id = $5 
            AND tipo_evaluacion = $6 
            AND (evaluacion_numero = $7 OR (evaluacion_numero IS NULL AND $7 IS NULL))
        `, {
          bind: [notaNum, user_id, observacion, student_id, course_id, tipo_evaluacion, evaluacion_numero || null]
        });
        console.log('✅ Nota ACTUALIZADA');
      } else {
        // Insertar nueva
        await sequelize.query(`
          INSERT INTO grades 
          (student_id, course_id, nota, tipo_evaluacion, evaluacion_numero, observacion, user_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, {
          bind: [student_id, course_id, notaNum, tipo_evaluacion, evaluacion_numero || null, observacion, user_id]
        });
        console.log('✅ Nota INSERTADA');
      }
      
      // Verificar que se guardó
      const verificar = await sequelize.query(`
        SELECT * FROM grades 
        WHERE student_id = $1 AND course_id = $2 AND tipo_evaluacion = $3
        ORDER BY id DESC LIMIT 1
      `, {
        bind: [student_id, course_id, tipo_evaluacion],
        type: sequelize.QueryTypes.SELECT
      });
      
      console.log('Verificación final:', verificar);
      
      const estado = notaNum >= 51 ? 'Aprobado' : 'Reprobado';
      return this.success(res, verificar[0], `Calificación guardada exitosamente (${estado})`, 201);
      
    } catch (error) {
      console.error('❌ Error en create grade:', error);
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