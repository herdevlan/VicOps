// backend/src/services/enrollmentService.js
const BaseService = require('./baseService');
const enrollmentRepository = require('../repositories/enrollmentRepository');
const studentRepository = require('../repositories/studentRepository');
const courseRepository = require('../repositories/courseRepository');
const auditRepository = require('../repositories/auditRepository');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

class EnrollmentService extends BaseService {
  constructor() {
    super(enrollmentRepository);
  }

  async getAllEnrollments() {
    return await enrollmentRepository.findAllWithDetails();
  }

  async getEnrollmentById(id) {
    const enrollment = await enrollmentRepository.findWithDetails(id);
    if (!enrollment) {
      throw new NotFoundError('Inscripción');
    }
    return enrollment;
  }

  async createEnrollment(enrollmentData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando inscripción: estudiante ${enrollmentData.student_id} en curso ${enrollmentData.course_id}`);
    
    // Verificar que el estudiante existe
    const student = await studentRepository.findById(enrollmentData.student_id);
    if (!student) {
      throw new ValidationError('El estudiante no existe');
    }
    
    // Verificar que el curso existe
    const course = await courseRepository.findById(enrollmentData.course_id);
    if (!course) {
      throw new ValidationError('El curso no existe');
    }
    
    // Verificar que no existe inscripción duplicada
    const existing = await enrollmentRepository.checkDuplicateEnrollment(
      enrollmentData.student_id,
      enrollmentData.course_id
    );
    
    if (existing) {
      throw new ValidationError('El estudiante ya está inscrito en este curso');
    }
    
    const enrollment = await enrollmentRepository.create(enrollmentData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'enrollment',
      enrollment.id,
      null,
      { student_id: enrollmentData.student_id, course_id: enrollmentData.course_id },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Inscripción creada: ID ${enrollment.id}`);
    return enrollment;
  }

  async updateEnrollmentStatus(id, estado, fechaRetiro = null, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando estado de inscripción ID: ${id} a ${estado}`);
    
    const enrollment = await enrollmentRepository.findById(id);
    if (!enrollment) {
      throw new NotFoundError('Inscripción');
    }
    
    const oldData = { ...enrollment.toJSON() };
    
    await enrollmentRepository.updateEnrollmentStatus(
      enrollment.student_id,
      enrollment.course_id,
      estado,
      fechaRetiro
    );
    
    const updated = await enrollmentRepository.findActiveEnrollment(enrollment.student_id, enrollment.course_id);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update_status',
      'enrollment',
      id,
      oldData,
      { estado, fechaRetiro },
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Estado de inscripción actualizado: ID ${id} -> ${estado}`);
    return updated;
  }

  async getStudentEnrollments(studentId, estado = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await enrollmentRepository.findByStudent(studentId, estado);
  }

  async getCourseEnrollments(courseId, estado = null) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await enrollmentRepository.findByCourse(courseId, estado);
  }

  async getCourseEnrollmentStats(courseId) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    return await enrollmentRepository.getCourseEnrollmentStats(courseId);
  }

  async getEnrollmentReport(gestion = null, grado = null) {
    return await enrollmentRepository.getEnrollmentReport(gestion, grado);
  }

  async bulkEnrollStudents(courseId, studentIds, ipAddress, userAgent, requestingUserId) {
    logger.info(`Inscripción masiva: ${studentIds.length} estudiantes en curso ${courseId}`);
    
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new ValidationError('El curso no existe');
    }
    
    const enrollmentsData = [];
    const errors = [];
    
    for (const studentId of studentIds) {
      const existing = await enrollmentRepository.checkDuplicateEnrollment(studentId, courseId);
      if (!existing) {
        enrollmentsData.push({
          student_id: studentId,
          course_id: courseId,
          estado: 'activo'
        });
      } else {
        errors.push({ studentId, error: 'Ya inscrito' });
      }
    }
    
    if (enrollmentsData.length > 0) {
      await enrollmentRepository.bulkCreateEnrollments(enrollmentsData);
      
      await auditRepository.log(
        requestingUserId,
        null,
        'bulk_create',
        'enrollment',
        courseId,
        null,
        { count: enrollmentsData.length, students: studentIds },
        ipAddress,
        userAgent,
        201,
        null
      );
    }
    
    return {
      created: enrollmentsData.length,
      errors,
      total: studentIds.length
    };
  }
}

module.exports = new EnrollmentService();