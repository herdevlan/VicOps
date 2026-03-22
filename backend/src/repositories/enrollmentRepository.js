// backend/src/repositories/enrollmentRepository.js
const BaseRepository = require('./baseRepository');
const { Enrollment, Student, Course, Subject, Teacher, User } = require('../models');
const { Op } = require('sequelize');

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(Enrollment);
  }

  async findWithDetails(id) {
    return await Enrollment.findByPk(id, {
      include: [
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user' }] 
        },
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: Subject, as: 'subject' },
            { model: Teacher, as: 'teacher', include: ['user'] }
          ] 
        }
      ]
    });
  }

  async findByStudent(studentId, estado = null) {
    const where = { student_id: studentId };
    if (estado) {
      where.estado = estado;
    }
    
    return await Enrollment.findAll({
      where,
      include: [
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: Subject, as: 'subject' },
            { model: Teacher, as: 'teacher', include: ['user'] }
          ] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async findByCourse(courseId, estado = null) {
    const where = { course_id: courseId };
    if (estado) {
      where.estado = estado;
    }
    
    return await Enrollment.findAll({
      where,
      include: [
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user' }] 
        }
      ],
      order: [[{ model: Student, as: 'student' }, 'apellido', 'ASC']]
    });
  }

  async findActiveEnrollment(studentId, courseId) {
    return await Enrollment.findOne({
      where: {
        student_id: studentId,
        course_id: courseId,
        estado: 'activo'
      }
    });
  }

  async checkDuplicateEnrollment(studentId, courseId) {
    const existing = await Enrollment.findOne({
      where: {
        student_id: studentId,
        course_id: courseId
      }
    });
    return existing;
  }

  async updateStudentFinalGrade(studentId, courseId, finalGrade) {
    return await Enrollment.update(
      { nota_final: finalGrade },
      { where: { student_id: studentId, course_id: courseId } }
    );
  }

  async updateEnrollmentStatus(studentId, courseId, estado, fechaRetiro = null) {
    const updateData = { estado };
    if (fechaRetiro) {
      updateData.fecha_retiro = fechaRetiro;
    }
    
    return await Enrollment.update(
      updateData,
      { where: { student_id: studentId, course_id: courseId } }
    );
  }

  async getStudentEnrollmentHistory(studentId) {
    return await Enrollment.findAll({
      where: { student_id: studentId },
      include: [
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: Subject, as: 'subject' },
            { model: Teacher, as: 'teacher', include: ['user'] }
          ] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getCourseEnrollmentStats(courseId) {
    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      attributes: ['estado', [Enrollment.sequelize.fn('COUNT', Enrollment.sequelize.col('id')), 'count']],
      group: ['estado']
    });
    
    const stats = {
      activo: 0,
      retirado: 0,
      aprobado: 0,
      reprobado: 0,
      trasladado: 0
    };
    
    for (const e of enrollments) {
      stats[e.estado] = parseInt(e.dataValues.count);
    }
    
    return stats;
  }

  async getStudentsByStatus(courseId, estado) {
    return await Enrollment.findAll({
      where: { course_id: courseId, estado },
      include: [
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user' }] 
        }
      ]
    });
  }

  async bulkCreateEnrollments(enrollmentsData) {
    return await Enrollment.bulkCreate(enrollmentsData, {
      updateOnDuplicate: ['estado', 'nota_final', 'observaciones']
    });
  }

  async getEnrollmentReport(gestion = null, grado = null) {
    const where = {};
    if (gestion) {
      where.gestion = gestion;
    }
    if (grado) {
      where.grado = grado;
    }
    
    const courses = await Course.findAll({ where });
    const report = [];
    
    for (const course of courses) {
      const enrollments = await this.findByCourse(course.id);
      report.push({
        course,
        total_enrolled: enrollments.length,
        active: enrollments.filter(e => e.estado === 'activo').length,
        completed: enrollments.filter(e => e.estado === 'aprobado' || e.estado === 'reprobado').length,
        withdrawn: enrollments.filter(e => e.estado === 'retirado').length
      });
    }
    
    return report;
  }
}

module.exports = new EnrollmentRepository();