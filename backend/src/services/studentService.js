// backend/src/services/studentService.js
const BaseService = require('./baseService');
const studentRepository = require('../repositories/studentRepository');
const userRepository = require('../repositories/userRepository');
const auditRepository = require('../repositories/auditRepository');
const bcrypt = require('bcrypt');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config/app_config');

class StudentService extends BaseService {
  constructor() {
    super(studentRepository);
  }

  async getAllStudents() {
    return await studentRepository.findAllWithDetails();
  }

  async getStudentById(id) {
    const student = await studentRepository.findWithDetails(id);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return student;
  }

  async getStudentWithEnrollments(id) {
    const student = await studentRepository.findWithEnrollments(id);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return student;
  }

  async createStudent(studentData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Creando estudiante: ${studentData.nombre} ${studentData.apellido}`);
    
    // Validar CI único
    await studentRepository.validateCIAssignation(studentData.ci);
    
    let user = null;
    let student = null;
    
    // Si se proporciona user_id, verificar que existe y usar ese usuario
    if (studentData.user_id) {
      user = await userRepository.findById(studentData.user_id);
      if (!user) {
        throw new ValidationError('Usuario no encontrado');
      }
    } else {
      // Crear usuario automáticamente con rol Estudiante (role_id = 2)
      const hashedPassword = await bcrypt.hash(
        studentData.password || 'Estudiante123!', 
        config.bcryptRounds
      );
      
      user = await userRepository.create({
        email: studentData.email,
        password: hashedPassword,
        nombre: studentData.nombre,
        apellido: studentData.apellido,
        ci: studentData.ci,
        telefono: studentData.telefono || null,
        role_id: 2, // Rol Estudiante
        estado: true
      });
      
      logger.info(`Usuario creado automáticamente: ${user.email} (ID: ${user.id})`);
    }
    
    // Crear el estudiante con el user_id
    student = await studentRepository.create({
      user_id: user.id,
      ci: studentData.ci,
      nombre: studentData.nombre,
      apellido: studentData.apellido,
      fecha_nacimiento: studentData.fecha_nacimiento || null,
      telefono: studentData.telefono || null,
      tutor_nombre: studentData.tutor_nombre || null,
      tutor_telefono: studentData.tutor_telefono || null,
      estado: true
    });
    
    // Registrar auditoría
    await auditRepository.log(
      requestingUserId,
      null,
      'create',
      'student',
      student.id,
      null,
      { ci: student.ci, nombre: student.nombre, apellido: student.apellido, user_id: user.id },
      ipAddress,
      userAgent,
      201,
      null
    );
    
    logger.info(`Estudiante creado: ${student.ci} (ID: ${student.id}) con usuario ${user.id}`);
    return student;
  }

  async updateStudent(id, studentData, ipAddress, userAgent, requestingUserId) {
    logger.info(`Actualizando estudiante ID: ${id}`);
    
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    const oldData = { ...student.toJSON() };
    
    // Validar CI único excluyendo el actual
    if (studentData.ci && studentData.ci !== student.ci) {
      await studentRepository.validateCIAssignation(studentData.ci, id);
    }
    
    const updatedStudent = await studentRepository.update(id, studentData);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'update',
      'student',
      id,
      oldData,
      updatedStudent.toJSON(),
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Estudiante actualizado: ID ${id}`);
    return updatedStudent;
  }

  async deleteStudent(id, ipAddress, userAgent, requestingUserId) {
    logger.info(`Eliminando estudiante ID: ${id}`);
    
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    const studentData = { ...student.toJSON() };
    
    await studentRepository.delete(id);
    
    await auditRepository.log(
      requestingUserId,
      null,
      'delete',
      'student',
      id,
      studentData,
      null,
      ipAddress,
      userAgent,
      200,
      null
    );
    
    logger.info(`Estudiante eliminado: ID ${id}`);
    return true;
  }

  async getStudentGrades(studentId, courseId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await studentRepository.getStudentGrades(studentId, courseId);
  }

  async getStudentAverage(studentId, courseId = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    if (courseId) {
      return await studentRepository.getStudentAverageByCourse(studentId, courseId);
    }
    return await studentRepository.getStudentAverage(studentId);
  }

  async getStudentEnrollments(studentId, estado = null) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await studentRepository.getStudentEnrollments(studentId, estado);
  }

  async getStudentCompleteHistory(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    return await studentRepository.getStudentCompleteHistory(studentId);
  }

  async searchStudents(searchTerm) {
    return await studentRepository.searchStudents(searchTerm);
  }

  async getStudentStatistics() {
    return await studentRepository.getStudentStatistics();
  }
}

module.exports = new StudentService();