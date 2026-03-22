// backend/src/repositories/courseRepository.js
const BaseRepository = require('./baseRepository');
const { Course, Subject, Teacher, Enrollment, Student, Grade, User } = require('../models');
const { Op } = require('sequelize');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  async findWithDetails(id) {
    return await Course.findByPk(id, {
      include: [
        { model: Subject, as: 'subject' },
        { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido', 'email'] }] },
        {
          model: Enrollment,
          as: 'enrollments',
          include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user' }] }],
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
        { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido', 'email'] }] }
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
      include: [{ model: Teacher, as: 'teacher', include: ['user'] }]
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
      include: [{ 
        model: Student, 
        as: 'student', 
        include: [{ model: User, as: 'user', attributes: ['email', 'telefono'] }]
      }],
      order: [[{ model: Student, as: 'student' }, 'apellido', 'ASC']]
    });
  }

  async getCourseGrades(courseId, evaluationType = null, bimestre = null) {
    const where = { course_id: courseId };
    if (evaluationType) {
      where.tipo_evaluacion = evaluationType;
    }
    if (bimestre) {
      where.bimestre = bimestre;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ],
      order: [['student_id', 'ASC'], ['fecha', 'ASC']]
    });
  }

  async getCourseStatistics(courseId) {
    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: ['nota', 'student_id']
    });
    
    if (grades.length === 0) {
      return { 
        total: 0, 
        average: 0, 
        max: 0, 
        min: 0, 
        approved: 0, 
        failed: 0,
        studentsWithGrades: 0,
        approvalRate: 0
      };
    }
    
    const notas = grades.map(g => parseFloat(g.nota));
    const total = notas.length;
    const average = notas.reduce((a, b) => a + b, 0) / total;
    const max = Math.max(...notas);
    const min = Math.min(...notas);
    
    // Calcular por estudiante (promedio por estudiante para aprobación)
    const studentGrades = {};
    for (const grade of grades) {
      if (!studentGrades[grade.student_id]) {
        studentGrades[grade.student_id] = [];
      }
      studentGrades[grade.student_id].push(parseFloat(grade.nota));
    }
    
    let approved = 0;
    let failed = 0;
    for (const studentId in studentGrades) {
      const studentAvg = studentGrades[studentId].reduce((a, b) => a + b, 0) / studentGrades[studentId].length;
      if (studentAvg >= 51) {
        approved++;
      } else {
        failed++;
      }
    }
    
    const studentsWithGrades = Object.keys(studentGrades).length;
    const approvalRate = studentsWithGrades > 0 ? (approved / studentsWithGrades) * 100 : 0;
    
    return { 
      total, 
      average: parseFloat(average.toFixed(2)), 
      max: parseFloat(max.toFixed(2)), 
      min: parseFloat(min.toFixed(2)), 
      approved, 
      failed,
      studentsWithGrades,
      approvalRate: parseFloat(approvalRate.toFixed(2))
    };
  }

  async getCoursePerformanceByBimestre(courseId) {
    const bimestres = [1, 2, 3, 4];
    const performance = {};
    
    for (const bimestre of bimestres) {
      const grades = await Grade.findAll({
        where: { course_id: courseId, bimestre },
        attributes: ['nota']
      });
      
      if (grades.length > 0) {
        const notas = grades.map(g => parseFloat(g.nota));
        performance[bimestre] = {
          average: parseFloat((notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2)),
          count: notas.length
        };
      } else {
        performance[bimestre] = { average: 0, count: 0 };
      }
    }
    
    return performance;
  }

  async checkUniqueCourse(grado, paralelo, gestion, subjectId, excludeId = null) {
    const where = { grado, paralelo, gestion, subject_id: subjectId };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    
    const existing = await Course.findOne({ where });
    return !existing;
  }

  async getCourseSummary(courseId) {
    const course = await this.findWithDetails(courseId);
    const students = await this.getCourseStudents(courseId);
    const statistics = await this.getCourseStatistics(courseId);
    const bimestrePerformance = await this.getCoursePerformanceByBimestre(courseId);
    
    return {
      course,
      totalStudents: students.length,
      statistics,
      bimestrePerformance
    };
  }

  async getCoursesByYear(gestion) {
    return await Course.findAll({
      where: { gestion },
      include: ['subject', 'teacher'],
      order: [['grado', 'ASC'], ['paralelo', 'ASC']]
    });
  }
}

module.exports = new CourseRepository();