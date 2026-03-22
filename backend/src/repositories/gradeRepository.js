// backend/src/repositories/gradeRepository.js
const BaseRepository = require('./baseRepository');
const { Grade, Student, Course, User, Subject, Teacher } = require('../models');
const { Op } = require('sequelize');

class GradeRepository extends BaseRepository {
  constructor() {
    super(Grade);
  }

  async findWithDetails(id) {
    return await Grade.findByPk(id, {
      include: [
        { model: Student, as: 'student', include: [{ model: User, as: 'user' }] },
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: Subject, as: 'subject' },
            { model: Teacher, as: 'teacher' }
          ] 
        },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ]
    });
  }

  async findByStudent(studentId, courseId = null, bimestre = null) {
    const where = { student_id: studentId };
    if (courseId) {
      where.course_id = courseId;
    }
    if (bimestre) {
      where.bimestre = bimestre;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { 
          model: Course, 
          as: 'course', 
          include: [{ model: Subject, as: 'subject' }]
        },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findByCourse(courseId, evaluationType = null, bimestre = null) {
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
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido'] }]
        },
        { model: User, as: 'registeredBy', attributes: ['nombre', 'apellido'] }
      ],
      order: [['student_id', 'ASC'], ['fecha', 'ASC']]
    });
  }

  async getStudentAverageByCourse(studentId, courseId) {
    const result = await Grade.findAll({
      where: { student_id: studentId, course_id: courseId },
      attributes: [
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average'],
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id')), 'count']
      ],
      raw: true
    });
    
    return {
      average: parseFloat(result[0].average) || 0,
      count: parseInt(result[0].count) || 0
    };
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
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0].average) || 0;
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
        { 
          model: Course, 
          as: 'course', 
          include: [{ model: Subject, as: 'subject' }]
        }
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
      include: ['student', 'course']
    });
  }

  async getTopStudents(courseId, limit = 5) {
    const grades = await Grade.findAll({
      where: { course_id: courseId },
      attributes: [
        'student_id',
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average']
      ],
      group: ['student_id'],
      order: [[this.model.sequelize.literal('average'), 'DESC']],
      limit,
      raw: true
    });
    
    // Obtener datos completos de los estudiantes
    const studentIds = grades.map(g => g.student_id);
    const students = await Student.findAll({
      where: { id: studentIds },
      include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido'] }]
    });
    
    return grades.map(g => ({
      ...g,
      student: students.find(s => s.id === g.student_id)
    }));
  }

  async getStudentPerformanceSummary(studentId) {
    const grades = await this.findByStudent(studentId);
    const courses = {};
    
    for (const grade of grades) {
      const courseId = grade.course_id;
      if (!courses[courseId]) {
        courses[courseId] = {
          course: grade.course,
          grades: [],
          average: 0,
          approved: false
        };
      }
      courses[courseId].grades.push(parseFloat(grade.nota));
    }
    
    for (const courseId in courses) {
      const avg = courses[courseId].grades.reduce((a, b) => a + b, 0) / courses[courseId].grades.length;
      courses[courseId].average = parseFloat(avg.toFixed(2));
      courses[courseId].approved = avg >= 51;
    }
    
    const allGrades = grades.map(g => parseFloat(g.nota));
    const overallAverage = allGrades.length > 0 
      ? parseFloat((allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2))
      : 0;
    
    const approvedCourses = Object.values(courses).filter(c => c.approved).length;
    const totalCourses = Object.keys(courses).length;
    
    return {
      overallAverage,
      totalGrades: allGrades.length,
      courses: Object.values(courses),
      performance: {
        approvedCourses,
        totalCourses,
        approvalRate: totalCourses > 0 ? (approvedCourses / totalCourses) * 100 : 0
      }
    };
  }

  async bulkCreateGrades(gradesData) {
    return await Grade.bulkCreate(gradesData);
  }

  async getCourseGradeMatrix(courseId) {
    const students = await Student.findAll({
      include: [
        { model: User, as: 'user' },
        {
          model: Enrollment,
          as: 'enrollments',
          where: { course_id: courseId, estado: 'activo' },
          required: true
        }
      ]
    });
    
    const grades = await this.findByCourse(courseId);
    const evaluationTypes = ['primer_parcial', 'segundo_parcial', 'tercer_parcial', 'final', 'trabajo', 'examen'];
    const bimestres = [1, 2, 3, 4];
    
    const matrix = [];
    for (const student of students) {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      const studentMatrix = {
        student: {
          id: student.id,
          nombre: student.nombre,
          apellido: student.apellido,
          ci: student.ci
        },
        grades: {}
      };
      
      for (const bimestre of bimestres) {
        studentMatrix.grades[bimestre] = {};
        for (const evalType of evaluationTypes) {
          const grade = studentGrades.find(g => g.bimestre === bimestre && g.tipo_evaluacion === evalType);
          studentMatrix.grades[bimestre][evalType] = grade ? parseFloat(grade.nota) : null;
        }
      }
      
      // Calcular promedio
      const allGrades = studentGrades.map(g => parseFloat(g.nota));
      studentMatrix.average = allGrades.length > 0 
        ? parseFloat((allGrades.reduce((a, b) => a + b, 0) / allGrades.length).toFixed(2))
        : 0;
      
      matrix.push(studentMatrix);
    }
    
    return matrix;
  }
}

module.exports = new GradeRepository();