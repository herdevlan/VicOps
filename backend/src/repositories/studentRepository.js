// backend/src/repositories/studentRepository.js
const BaseRepository = require('./baseRepository');
const { Student, User, Enrollment, Grade, Course, Subject } = require('../models');
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
    return await Student.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user',
          include: [{ model: require('../models').Role, as: 'role' }],
          attributes: { exclude: ['password'] }
        }
      ]
    });
  }

  async findWithEnrollments(id) {
    return await Student.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user',
          attributes: { exclude: ['password'] }
        },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            { 
              model: Course, 
              as: 'course',
              include: [
                { model: Subject, as: 'subject' },
                { model: require('../models').Teacher, as: 'teacher', include: ['user'] }
              ]
            }
          ],
          where: { estado: 'activo' },
          required: false
        }
      ]
    });
  }

  async findAllWithDetails(options = {}) {
    return await Student.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } }
      ],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']],
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
        { 
          model: Course, 
          as: 'course',
          include: [{ model: Subject, as: 'subject' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async getStudentAverage(studentId) {
    const result = await Grade.findAll({
      where: { student_id: studentId },
      attributes: [
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0].average) || 0;
  }

  async getStudentAverageByCourse(studentId, courseId) {
    const result = await Grade.findAll({
      where: { student_id: studentId, course_id: courseId },
      attributes: [
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0].average) || 0;
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
          include: [
            { model: Subject, as: 'subject' },
            { model: require('../models').Teacher, as: 'teacher', include: ['user'] }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  async getStudentCompleteHistory(studentId) {
    const enrollments = await this.getStudentEnrollments(studentId);
    const grades = await this.getStudentGrades(studentId);
    
    // Agrupar por curso
    const history = {};
    for (const enrollment of enrollments) {
      const courseId = enrollment.course_id;
      const courseGrades = grades.filter(g => g.course_id === courseId);
      const average = courseGrades.length > 0 
        ? courseGrades.reduce((sum, g) => sum + parseFloat(g.nota), 0) / courseGrades.length
        : 0;
      
      history[courseId] = {
        course: enrollment.course,
        enrollment: enrollment,
        grades: courseGrades,
        average: average,
        status: enrollment.estado,
        finalGrade: enrollment.nota_final
      };
    }
    
    return history;
  }

  async getStudentsByCourse(courseId, estado = 'activo') {
    return await Enrollment.findAll({
      where: { course_id: courseId, estado },
      include: [
        { 
          model: Student, 
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['email', 'telefono'] }]
        }
      ],
      order: [[{ model: Student, as: 'student' }, 'apellido', 'ASC']]
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

  async searchStudents(searchTerm) {
    return await Student.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${searchTerm}%` } },
          { apellido: { [Op.iLike]: `%${searchTerm}%` } },
          { ci: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      include: [{ model: User, as: 'user', attributes: ['email'] }],
      limit: 20
    });
  }

  async getStudentStatistics() {
    const total = await this.model.count();
    const active = await this.model.count({ where: { estado: true } });
    const withGrades = await Grade.findAll({
      attributes: [[this.model.sequelize.fn('DISTINCT', this.model.sequelize.col('student_id')), 'student_id']],
      raw: true
    });
    
    return {
      total,
      active,
      inactive: total - active,
      withGrades: withGrades.length,
      withoutGrades: active - withGrades.length
    };
  }
}

module.exports = new StudentRepository();