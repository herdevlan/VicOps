// backend/src/repositories/studentRepository.js
const BaseRepository = require('./baseRepository');
const { Student, User, Role, Enrollment, Grade, Course, Subject } = require('../models');
const { Op } = require('sequelize');

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async findByCI(ci) {
    return await Student.findOne({ where: { ci } });
  }

  async findByUserId(userId) {
    return await Student.findOne({
      where: { user_id: userId },
      include: [{ model: User, as: 'user', attributes: { exclude: ['password'] } }]
    });
  }

  async findWithDetails(id) {
    // Versión simplificada sin paranoid para evitar errores
    const student = await Student.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: { exclude: ['password'] },
          required: false
        }
      ]
    });
    
    if (student && student.user) {
      // Cargar el rol manualmente
      const role = await Role.findByPk(student.user.role_id);
      if (role) {
        student.user.dataValues.role = role;
      }
    }
    
    return student;
  }

  async findAllWithDetails(options = {}) {
    return await Student.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ],
      ...options
    });
  }

  async getActiveStudents() {
    return await Student.findAll({
      where: { estado: true },
      include: [{ model: User, as: 'user', attributes: ['email', 'telefono'] }]
    });
  }

  async getStudentGrades(studentId, courseId = null) {
    const where = { student_id: studentId };
    if (courseId) {
      where.course_id = courseId;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { model: Course, as: 'course', include: [{ model: Subject, as: 'subject' }] }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async getStudentAverage(studentId) {
    const result = await Grade.findAll({
      where: { student_id: studentId },
      attributes: [
        [Grade.sequelize.fn('AVG', Grade.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0]?.average) || 0;
  }

  async getStudentEnrollments(studentId, estado = null) {
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
          include: [{ model: Subject, as: 'subject' }]
        }
      ]
    });
  }

  async validateCIAssignation(ci, studentId = null) {
    const where = { ci };
    if (studentId) {
      where.id = { [Op.ne]: studentId };
    }
    
    const existing = await Student.findOne({ where });
    if (existing) {
      throw new Error('El CI ya está registrado para otro estudiante');
    }
  }

  async findById(id) {
    return await Student.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ]
    });
  }
}

module.exports = new StudentRepository();