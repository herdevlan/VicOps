// backend/src/services/courseService.js
const BaseService = require('./baseService');
const courseRepository = require('../repositories/courseRepository');
const subjectRepository = require('../repositories/subjectRepository');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class CourseService extends BaseService {
  constructor() {
    super(courseRepository);
  }

  async getAllCourses() {
    return await courseRepository.findAllWithDetails();
  }

  async getCourseById(id) {
    const course = await courseRepository.findWithDetails(id);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return course;
  }

  async createCourse(courseData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando curso: ${courseData.nombre}`);
    
    // Validar que la materia existe
    const subject = await subjectRepository.findById(courseData.subject_id);
    if (!subject) {
      throw new ValidationError('La materia especificada no existe');
    }
    
    // Validar unicidad del curso
    const isUnique = await courseRepository.checkUniqueCourse(
      courseData.grado,
      courseData.paralelo,
      courseData.gestion,
      courseData.subject_id
    );
    
    if (!isUnique) {
      throw new ValidationError(`Ya existe un curso para ${subject.nombre} en ${courseData.grado}° ${courseData.paralelo} (Gestión ${courseData.gestion})`);
    }
    
    const course = await courseRepository.create(courseData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'course',
      course.id,
      null,
      { nombre: course.nombre, grado: course.grado, paralelo: course.paralelo },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Curso creado: ID ${course.id}`);
    return course;
  }

  async updateCourse(id, courseData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando curso ID: ${id}`);
    
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    
    const oldData = { ...course.toJSON() };
    
    // Validar unicidad si cambian datos relevantes
    if (courseData.grado || courseData.paralelo || courseData.gestion || courseData.subject_id) {
      const grado = courseData.grado || course.grado;
      const paralelo = courseData.paralelo || course.paralelo;
      const gestion = courseData.gestion || course.gestion;
      const subjectId = courseData.subject_id || course.subject_id;
      
      const isUnique = await courseRepository.checkUniqueCourse(grado, paralelo, gestion, subjectId, id);
      if (!isUnique) {
        throw new ValidationError('Ya existe un curso con esas características');
      }
    }
    
    const updatedCourse = await courseRepository.update(id, courseData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update',
      'course',
      id,
      oldData,
      updatedCourse.toJSON(),
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Curso actualizado: ID ${id}`);
    return updatedCourse;
  }

  async deleteCourse(id, ipAddress, userAgent, requestingUserId) {
    logger.info(`Eliminando curso ID: ${id}`);
    
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    
    const courseData = { ...course.toJSON() };
    
    await courseRepository.delete(id);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'delete',
      'course',
      id,
      courseData,
      null,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Curso eliminado: ID ${id}`);
    return true;
  }

  async getCoursesByTeacher(teacherId, gestion = null) {
    return await courseRepository.findByTeacher(teacherId, gestion);
  }

  async getCoursesBySubject(subjectId, gestion = null) {
    return await courseRepository.findBySubject(subjectId, gestion);
  }

  async getCoursesByYear(gestion) {
    return await courseRepository.getCoursesByYear(gestion);
  }

  async getCourseStudents(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await courseRepository.getCourseStudents(courseId);
  }

  async getCourseGrades(courseId, evaluationType = null, bimestre = null) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await courseRepository.getCourseGrades(courseId, evaluationType, bimestre);
  }

  async getCourseStatistics(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await courseRepository.getCourseStatistics(courseId);
  }

  async getCourseSummary(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await courseRepository.getCourseSummary(courseId);
  }
}

module.exports = new CourseService();