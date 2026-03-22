// backend/src/repositories/courseRepository.js
const BaseRepository = require('./baseRepository');
const { Course, Subject, Teacher, Enrollment, Student, Grade } = require('../models');
const { Op } = require('sequelize');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findWithDetails(id) {
    return await Course.findByPk(id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher', include: ['user'] },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [{ model: Student, as: 'student', include: ['user'] }],
          where: { estado: 'activo' },
          required: false
        }
      ]
    });
  }

  async findAllWithDetails(options = {}) {
    return await Course.findAll({
      include: [
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher', include: ['user'] }
      ],
      order: [['gestion', 'DESC'], ['grado', 'ASC'], ['paralelo', 'ASC']],
      ...options
    });
  }

  async findByTeacher(teacherId, gestion = null) {
    const where = { teacher_id: teacherId };
    if (gestion) {
      where.gestion = gestion;
    }
    
    return await Course.findAll({
      where,
      include: [{ model: Subject, as: 'subject' }]
    });
  }

  async findBySubject(subjectId, gestion = null) {
    const where = { subject_id: subjectId };
    if (gestion) {
      where.gestion = gestion;
    }
    
    return await Course.findAll({
      where,
      include: [{ model: Teacher, as: 'teacher' }]
    });
  }

  async findByGestion(gestion) {
    return await Course.findAll({
      where: { gestion },
      include: ['subject', 'teacher']
    });
  }

  async getAvailableCourses(gestion, grado = null) {
    const where = { 
      gestion,
      estado: true
    };
    
    if (grado) {
      where.grado = grado;
    }
    
    return await Course.findAll({
      where,
      include: ['subject', 'teacher']
    });
  }

  async getCourseStudents(courseId, estado = 'activo') {
    return await Enrollment.findAll({
      where: { 
        course_id: courseId,
        estado 
      },
      include: [{ model: Student, as: 'student', include: ['user'] }]
    });
  }

  async getCourseGrades(courseId, evaluationType = null) {
    const where = { course_id: courseId };
    if (evaluationType) {
      where.tipo_evaluacion = evaluationType;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { model: Student, as: 'student' },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ]
    });
  }

  async getCourseStatistics(courseId) {
    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: ['nota']
    });
    
    if (grades.length === 0) {
      return { total: 0, average: 0, max: 0, min: 0, approved: 0, failed: 0 };
    }
    
    const notas = grades.map(g => parseFloat(g.nota));
    const total = notas.length;
    const average = notas.reduce((a, b) => a + b, 0) / total;
    const max = Math.max(...notas);
    const min = Math.min(...notas);
    const approved = notas.filter(n => n >= 51).length;
    const failed = notas.filter(n => n < 51).length;
    
    return { total, average, max, min, approved, failed };
  }

  async checkUniqueCourse(grado, paralelo, gestion, subjectId, excludeId = null) {
    const where = { grado, paralelo, gestion, subject_id: subjectId };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const existing = await Course.findOne({ where });
    return !existing;
  }
}

module.exports = new CourseRepository();