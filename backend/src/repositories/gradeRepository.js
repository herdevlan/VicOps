//backend/src/repositories/gradeRepository.js

const BaseRepository = require('./baseRepository');
const { Grade, Student, Course, User, Subject } = require('../models');
const { Op } = require('sequelize');

class GradeRepository extends BaseRepository {
  constructor() {
    super(Grade);
  }

  async findAllWithDetails() {
    try {
      const grades = await Grade.findAll({
        include: [
          { 
            model: Student, 
            as: 'student',
            attributes: ['id', 'nombre', 'apellido', 'matricula', 'grado', 'nivel']
          },
          { 
            model: Course, 
            as: 'course',
            include: [{ model: Subject, as: 'subject' }],
            attributes: ['id', 'nombre', 'grado', 'paralelo', 'gestion']
          },
          { 
            model: User, 
            as: 'registeredBy',
            attributes: ['id', 'nombre', 'apellido', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 100
      });
      return grades;
    } catch (error) {
      console.error('Error en findAllWithDetails:', error.message);
      // Fallback: devolver solo notas sin relaciones
      return await Grade.findAll({
        order: [['created_at', 'DESC']],
        limit: 100
      });
    }
  }

  async findByStudent(studentId, courseId = null) {
    const where = { student_id: studentId };
    if (courseId) {
      where.course_id = courseId;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { model: Course, as: 'course', include: [{ model: Subject, as: 'subject' }] },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findByCourse(courseId, evaluationType = null) {
    const where = { course_id: courseId };
    if (evaluationType) {
      where.tipo_evaluacion = evaluationType;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { model: Student, as: 'student', attributes: ['id', 'nombre', 'apellido', 'matricula'] },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ],
      order: [['student_id', 'ASC'], ['fecha', 'ASC']]
    });
  }

  async getStudentAverageByCourse(studentId, courseId) {
    const result = await Grade.findAll({
      where: { student_id: studentId, course_id: courseId },
      attributes: [
        [Grade.sequelize.fn('AVG', Grade.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0]?.average) || 0;
  }

  async getStudentGradesByBimestre(studentId, courseId, bimestre) {
    return await Grade.findAll({
      where: { 
        student_id: studentId, 
        course_id: courseId,
        bimestre 
      },
      order: [['fecha', 'ASC']]
    });
  }

  async getCourseAverageByEvaluationType(courseId, evaluationType) {
    const result = await Grade.findAll({
      where: { course_id: courseId, tipo_evaluacion: evaluationType },
      attributes: [
        [Grade.sequelize.fn('AVG', Grade.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0]?.average) || 0;
  }

  async findDuplicateGrade(studentId, courseId, evaluationType, bimestre = null) {
    const where = { 
      student_id: studentId, 
      course_id: courseId, 
      tipo_evaluacion: evaluationType 
    };
    
    if (bimestre) {
      where.bimestre = bimestre;
    }
    
    return await Grade.findOne({ where });
  }

  async getGradeHistory(studentId, limit = 10) {
    return await Grade.findAll({
      where: { student_id: studentId },
      include: [
        { model: Course, as: 'course', include: [{ model: Subject, as: 'subject' }] }
      ],
      order: [['fecha', 'DESC']],
      limit
    });
  }

  async getGradesByDateRange(startDate, endDate) {
    return await Grade.findAll({
      where: {
        fecha: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        { model: Student, as: 'student' },
        { model: Course, as: 'course' }
      ]
    });
  }

  async getTopStudents(courseId, limit = 5) {
    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: [
        'student_id',
        [Grade.sequelize.fn('AVG', Grade.sequelize.col('nota')), 'average']
      ],
      include: [
        { model: Student, as: 'student', attributes: ['nombre', 'apellido', 'matricula'] }
      ],
      group: ['student_id', 'student.id'],
      order: [[Grade.sequelize.literal('average'), 'DESC']],
      limit,
      subQuery: false
    });
    
    return grades;
  }
}

module.exports = new GradeRepository();