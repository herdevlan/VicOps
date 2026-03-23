// backend/src/repositories/gradeRepository.js
const BaseRepository = require('./baseRepository');
const { Grade, Student, Course, User, Subject, Teacher, Enrollment } = require('../models');
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
            { model: Teacher, as: 'teacher', include: [{ model: User, as: 'user' }] }
          ] 
        },
        { model: User, as: 'registeredBy', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });
  }

  /**
   * Buscar calificaciones por estudiante
   * @param {number} studentId - ID del estudiante
   * @param {number} courseId - ID del curso (opcional)
   * @param {number} evaluacionNumero - Número de evaluación (opcional)
   */
  async findByStudent(studentId, courseId = null, evaluacionNumero = null) {
    const where = { student_id: studentId };
    if (courseId) {
      where.course_id = courseId;
    }
    if (evaluacionNumero) {
      where.evaluacion_numero = evaluacionNumero;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { 
          model: Course, 
          as: 'course', 
          include: [
            { model: Subject, as: 'subject' },
            { model: Teacher, as: 'teacher' }
          ]
        },
        { model: User, as: 'registeredBy', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['evaluacion_numero', 'ASC'], ['fecha', 'ASC']]
    });
  }

  /**
   * Buscar calificaciones por curso
   * @param {number} courseId - ID del curso
   * @param {string} evaluationType - Tipo de evaluación (opcional)
   * @param {number} evaluacionNumero - Número de evaluación (opcional)
   */
  async findByCourse(courseId, evaluationType = null, evaluacionNumero = null) {
    const where = { course_id: courseId };
    if (evaluationType) {
      where.tipo_evaluacion = evaluationType;
    }
    if (evaluacionNumero) {
      where.evaluacion_numero = evaluacionNumero;
    }
    
    return await Grade.findAll({
      where,
      include: [
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user', attributes: ['id', 'nombre', 'apellido'] }]
        },
        { model: User, as: 'registeredBy', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['student_id', 'ASC'], ['evaluacion_numero', 'ASC'], ['fecha', 'ASC']]
    });
  }

  /**
   * Obtener promedio del estudiante por curso
   * @param {number} studentId - ID del estudiante
   * @param {number} courseId - ID del curso
   */
  async getStudentAverageByCourse(studentId, courseId) {
    const result = await Grade.findAll({
      where: { student_id: studentId, course_id: courseId },
      attributes: [
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average'],
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id')), 'total_grades']
      ],
      raw: true
    });
    
    return {
      average: parseFloat(result[0]?.average) || 0,
      totalGrades: parseInt(result[0]?.total_grades) || 0
    };
  }

  /**
   * Obtener todas las evaluaciones de un estudiante por curso
   * @param {number} studentId - ID del estudiante
   * @param {number} courseId - ID del curso
   */
  async getStudentEvaluations(studentId, courseId) {
    return await Grade.findAll({
      where: { student_id: studentId, course_id: courseId },
      attributes: ['id', 'nota', 'tipo_evaluacion', 'evaluacion_numero', 'fecha', 'porcentaje', 'observacion'],
      order: [['evaluacion_numero', 'ASC']]
    });
  }

  /**
   * Obtener todas las evaluaciones de un curso con datos de estudiantes
   * @param {number} courseId - ID del curso
   */
  async getCourseEvaluations(courseId) {
    return await Grade.findAll({
      where: { course_id: courseId },
      include: [
        { 
          model: Student, 
          as: 'student', 
          include: [{ model: User, as: 'user', attributes: ['id', 'nombre', 'apellido'] }]
        }
      ],
      order: [['evaluacion_numero', 'ASC'], ['student_id', 'ASC']]
    });
  }

  /**
   * Obtener calificaciones por bimestre (mantener compatibilidad)
   */
  async findByStudentBimestre(studentId, courseId, bimestre) {
    return await Grade.findAll({
      where: { 
        student_id: studentId, 
        course_id: courseId,
        bimestre: bimestre
      },
      order: [['fecha', 'ASC']]
    });
  }

  /**
   * Obtener promedio del curso por tipo de evaluación
   */
  async getCourseAverageByEvaluationType(courseId, evaluationType) {
    const result = await Grade.findAll({
      where: { course_id: courseId, tipo_evaluacion: evaluationType },
      attributes: [
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('nota')), 'average']
      ],
      raw: true
    });
    
    return parseFloat(result[0]?.average) || 0;
  }

  /**
   * Verificar si existe calificación duplicada
   */
  async findDuplicateGrade(studentId, courseId, evaluationType, evaluacionNumero = null) {
    const where = { 
      student_id: studentId, 
      course_id: courseId, 
      tipo_evaluacion: evaluationType 
    };
    
    if (evaluacionNumero) {
      where.evaluacion_numero = evaluacionNumero;
    }
    
    return await Grade.findOne({ where });
  }

  /**
   * Obtener historial de calificaciones del estudiante
   */
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

  /**
   * Obtener calificaciones por rango de fechas
   */
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

  /**
   * Obtener mejores estudiantes de un curso
   */
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
    
    const studentIds = grades.map(g => g.student_id);
    const students = await Student.findAll({
      where: { id: studentIds },
      include: [{ model: User, as: 'user', attributes: ['id', 'nombre', 'apellido'] }]
    });
    
    return grades.map(g => ({
      average: parseFloat(g.average),
      student: students.find(s => s.id === g.student_id)
    }));
  }

  /**
   * Resumen de rendimiento del estudiante
   */
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
      courses[courseId].approved = avg >= 51; // Nota de aprobación en Bolivia
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

  /**
   * Creación masiva de calificaciones
   */
  async bulkCreateGrades(gradesData) {
    return await Grade.bulkCreate(gradesData);
  }

  /**
   * Matriz de calificaciones por curso (tabla completa)
   */
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
    const evaluacionNumeros = [1, 2, 3, 4, 5, 6];
    
    const matrix = [];
    for (const student of students) {
      const studentGrades = grades.filter(g => g.student_id === student.id);
      const studentMatrix = {
        student: {
          id: student.id,
          nombre: student.nombre,
          apellido: student.apellido,
          ci: student.ci,
          matricula: student.matricula
        },
        grades: {}
      };
      
      for (const evalNum of evaluacionNumeros) {
        studentMatrix.grades[evalNum] = {};
        for (const evalType of evaluationTypes) {
          const grade = studentGrades.find(g => g.evaluacion_numero === evalNum && g.tipo_evaluacion === evalType);
          studentMatrix.grades[evalNum][evalType] = grade ? parseFloat(grade.nota) : null;
        }
      }
      
      // Calcular promedio general del estudiante en este curso
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