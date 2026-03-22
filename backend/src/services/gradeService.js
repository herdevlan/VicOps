// backend/src/services/gradeService.js
const BaseService = require('./baseService');
const gradeRepository = require('../repositories/gradeRepository');
const studentRepository = require('../repositories/studentRepository');
const courseRepository = require('../repositories/courseRepository');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class GradeService extends BaseService {
  constructor() {
    super(gradeRepository);
  }

  async createGrade(gradeData, userId, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando nota para estudiante ${gradeData.student_id} en curso ${gradeData.course_id}`);
    
    // Verificar que el estudiante existe
    const student = await studentRepository.findById(gradeData.student_id);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    // Verificar que el curso existe
    const course = await courseRepository.findById(gradeData.course_id);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    
    // Verificar que el estudiante está inscrito en el curso
    const enrollment = await enrollmentRepository.findActiveEnrollment(
      gradeData.student_id,
      gradeData.course_id
    );
    
    if (!enrollment) {
      throw new ValidationError('El estudiante no está inscrito en este curso');
    }
    
    // Verificar que no existe duplicado de evaluación
    const existing = await gradeRepository.findDuplicateGrade(
      gradeData.student_id,
      gradeData.course_id,
      gradeData.tipo_evaluacion,
      gradeData.bimestre
    );
    
    if (existing) {
      throw new ValidationError(`Ya existe una calificación para ${gradeData.tipo_evaluacion} en este curso`);
    }
    
    const grade = await gradeRepository.create({
      ...gradeData,
      user_id: userId
    });
    
    // Actualizar promedio del estudiante en la inscripción si es final
    if (gradeData.tipo_evaluacion === 'final') {
      const average = await gradeRepository.getStudentAverageByCourse(
        gradeData.student_id,
        gradeData.course_id
      );
      
      const finalGrade = average.average;
      const estado = finalGrade >= 51 ? 'aprobado' : 'reprobado';
      
      await enrollmentRepository.updateStudentFinalGrade(
        gradeData.student_id,
        gradeData.course_id,
        finalGrade
      );
      
      await enrollmentRepository.updateEnrollmentStatus(
        gradeData.student_id,
        gradeData.course_id,
        estado
      );
    }
    
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'grade',
      grade.id,
      null,
      { nota: gradeData.nota, tipo: gradeData.tipo_evaluacion },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Nota creada: ID ${grade.id}`);
    return grade;
  }

  async updateGrade(id, gradeData, userId, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando nota ID: ${id}`);
    
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota');
    }
    
    const oldData = { ...grade.toJSON() };
    
    const updatedGrade = await gradeRepository.update(id, {
      ...gradeData,
      user_id: userId
    });
    
    // Si es evaluación final, recalcular promedio
    if (grade.tipo_evaluacion === 'final' || gradeData.tipo_evaluacion === 'final') {
      const average = await gradeRepository.getStudentAverageByCourse(
        grade.student_id,
        grade.course_id
      );
      
      const finalGrade = average.average;
      const estado = finalGrade >= 51 ? 'aprobado' : 'reprobado';
      
      await enrollmentRepository.updateStudentFinalGrade(
        grade.student_id,
        grade.course_id,
        finalGrade
      );
      
      await enrollmentRepository.updateEnrollmentStatus(
        grade.student_id,
        grade.course_id,
        estado
      );
    }
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update',
      'grade',
      id,
      oldData,
      updatedGrade.toJSON(),
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Nota actualizada: ID ${id}`);
    return updatedGrade;
  }

  async getStudentGrades(studentId, courseId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await gradeRepository.findByStudent(studentId, courseId);
  }

  async getCourseGrades(courseId, evaluationType = null, bimestre = null) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await gradeRepository.findByCourse(courseId, evaluationType, bimestre);
  }

  async getStudentAverage(studentId, courseId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    if (courseId) {
      return await gradeRepository.getStudentAverageByCourse(studentId, courseId);
    }
    return await studentRepository.getStudentAverage(studentId);
  }

  async getCourseStatistics(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await courseRepository.getCourseStatistics(courseId);
  }

  async deleteGrade(id, ipAddress, userAgent, requestingUserId) {
    logger.info(`Eliminando nota ID: ${id}`);
    
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota');
    }
    
    const gradeData = { ...grade.toJSON() };
    
    await gradeRepository.delete(id);
    
    // Recalcular promedio si era evaluación final
    if (grade.tipo_evaluacion === 'final') {
      const average = await gradeRepository.getStudentAverageByCourse(
        grade.student_id,
        grade.course_id
      );
      
      const finalGrade = average.average;
      const estado = finalGrade >= 51 ? 'aprobado' : 'reprobado';
      
      await enrollmentRepository.updateStudentFinalGrade(
        grade.student_id,
        grade.course_id,
        finalGrade
      );
      
      await enrollmentRepository.updateEnrollmentStatus(
        grade.student_id,
        grade.course_id,
        estado
      );
    }
    
    await auditRepository.log(
      requestingUserId,
      null,
      'delete',
      'grade',
      id,
      gradeData,
      null,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Nota eliminada: ID ${id}`);
    return true;
  }

  async getStudentGradeHistory(studentId, limit = 10) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await gradeRepository.getGradeHistory(studentId, limit);
  }

  async getTopStudents(courseId, limit = 5) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await gradeRepository.getTopStudents(courseId, limit);
  }

  async getStudentPerformanceSummary(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await gradeRepository.getStudentPerformanceSummary(studentId);
  }

  async getCourseGradeMatrix(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await gradeRepository.getCourseGradeMatrix(courseId);
  }

  async getStudentGradesByBimestre(studentId, courseId, bimestre) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await gradeRepository.getStudentGradesByBimestre(studentId, courseId, bimestre);
  }
}

module.exports = new GradeService();