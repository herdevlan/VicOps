//backend/src/services/gradeService.js

const BaseService = require('./baseService');
const gradeRepository = require('../repositories/gradeRepository');
const studentRepository = require('../repositories/studentRepository');
const courseRepository = require('../repositories/courseRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class GradeService extends BaseService {
  constructor() {
    super(gradeRepository);
  }

  async getAllGrades() {
    return await gradeRepository.findAllWithDetails();
  }

  async getGradeById(id) {
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota');
    }
    return grade;
  }

  async createGrade(gradeData, userId) {
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
      user_id: userId,
      fecha: new Date()
    });
    
    logger.info(`Nota creada: ID ${grade.id}`);
    return grade;
  }

  async updateGrade(id, gradeData, userId) {
    logger.info(`Actualizando nota ID: ${id}`);
    
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota');
    }
    
    const updatedGrade = await gradeRepository.update(id, {
      ...gradeData,
      user_id: userId
    });
    
    logger.info(`Nota actualizada: ID ${id}`);
    return updatedGrade;
  }

  async deleteGrade(id) {
    logger.info(`Eliminando nota ID: ${id}`);
    
    const grade = await gradeRepository.findById(id);
    if (!grade) {
      throw new NotFoundError('Nota');
    }
    
    await gradeRepository.delete(id);
    logger.info(`Nota eliminada: ID ${id}`);
    
    return true;
  }

  async getStudentGrades(studentId, courseId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    return await gradeRepository.findByStudent(studentId, courseId);
  }

  async getCourseGrades(courseId, evaluationType = null) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    
    return await gradeRepository.findByCourse(courseId, evaluationType);
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
}

module.exports = new GradeService();