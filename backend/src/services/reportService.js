// backend/src/services/reportService.js
const studentRepository = require('../repositories/studentRepository');
const courseRepository = require('../repositories/courseRepository');
const gradeRepository = require('../repositories/gradeRepository');
const userRepository = require('../repositories/userRepository');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class ReportService {
  async getDashboardStats(gestion = null) {
    logger.info(`Generando estadísticas de dashboard para gestión: ${gestion || 'todas'}`);
    
    try {
      // Obtener estudiantes activos
      const students = await studentRepository.getActiveStudents();
      
      // Obtener cursos
      let courses;
      if (gestion) {
        courses = await courseRepository.findByGestion(gestion);
      } else {
        courses = await courseRepository.findAllWithDetails();
      }
      
      // Obtener docentes
      const teachers = await userRepository.findByRole(3);
      
      // Calcular promedios generales
      let totalAverage = 0;
      let totalApproved = 0;
      let totalFailed = 0;
      let totalGrades = 0;
      let totalCourses = courses.length;
      
      for (const course of courses) {
        const stats = await courseRepository.getCourseStatistics(course.id);
        if (stats && stats.total > 0) {
          totalAverage += (stats.average || 0) * stats.total;
          totalApproved += stats.approved || 0;
          totalFailed += stats.failed || 0;
          totalGrades += stats.total || 0;
        }
      }
      
      const overallAverage = totalGrades > 0 ? totalAverage / totalGrades : 0;
      const approvalRate = totalGrades > 0 ? (totalApproved / totalGrades) * 100 : 0;
      
      // Obtener notas por bimestre
      const gradesByBimestre = await this.getGradesByBimestre(gestion);
      
      // Obtener rendimiento por curso
      const performanceByCourse = await this.getPerformanceByCourse(courses);
      
      return {
        total_students: students.length,
        total_teachers: teachers.length,
        total_courses: totalCourses,
        total_grades: totalGrades,
        overall_average: parseFloat(overallAverage.toFixed(2)),
        approval_rate: parseFloat(approvalRate.toFixed(2)),
        failure_rate: parseFloat((100 - approvalRate).toFixed(2)),
        students_active: students.filter(s => s.estado).length,
        courses_active: courses.filter(c => c.estado).length,
        grades_by_bimestre: gradesByBimestre,
        performance_by_course: performanceByCourse.slice(0, 10) // Top 10 cursos
      };
    } catch (error) {
      logger.error('Error en getDashboardStats:', error);
      return {
        total_students: 0,
        total_teachers: 0,
        total_courses: 0,
        total_grades: 0,
        overall_average: 0,
        approval_rate: 0,
        failure_rate: 0,
        students_active: 0,
        courses_active: 0,
        grades_by_bimestre: [],
        performance_by_course: []
      };
    }
  }

  async getGradesByBimestre(gestion = null) {
    try {
      const grades = await gradeRepository.findAll();
      
      const bimestres = [1, 2, 3, 4];
      const result = [];
      
      for (const bimestre of bimestres) {
        const bimestreGrades = grades.filter(g => g.bimestre === bimestre);
        const count = bimestreGrades.length;
        const average = count > 0 
          ? bimestreGrades.reduce((sum, g) => sum + parseFloat(g.nota), 0) / count 
          : 0;
        
        result.push({
          bimestre,
          total_grades: count,
          average: parseFloat(average.toFixed(2))
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error en getGradesByBimestre:', error);
      return [];
    }
  }

  async getPerformanceByCourse(courses) {
    try {
      const performance = [];
      
      for (const course of courses) {
        const stats = await courseRepository.getCourseStatistics(course.id);
        if (stats && stats.total > 0) {
          performance.push({
            course_id: course.id,
            course_name: course.nombre,
            subject: course.subject?.nombre || 'Sin materia',
            average: parseFloat(stats.average.toFixed(2)),
            total_students: stats.total,
            approved: stats.approved,
            failed: stats.failed,
            approval_rate: parseFloat(((stats.approved / stats.total) * 100).toFixed(2))
          });
        }
      }
      
      return performance.sort((a, b) => b.average - a.average);
    } catch (error) {
      logger.error('Error en getPerformanceByCourse:', error);
      return [];
    }
  }

  async getStudentReport(studentId) {
    logger.info(`Generando reporte para estudiante ID: ${studentId}`);
    
    const student = await studentRepository.findWithDetails(studentId);
    if (!student) {
      throw new NotFoundError('Estudiante');
    }
    
    const grades = await gradeRepository.findByStudent(studentId);
    const average = await studentRepository.getStudentAverage(studentId);
    
    // Agrupar notas por curso
    const coursesGrades = {};
    for (const grade of grades) {
      const courseKey = grade.course_id;
      if (!coursesGrades[courseKey]) {
        coursesGrades[courseKey] = {
          course: grade.course,
          grades: [],
          average: 0,
          total_grades: 0
        };
      }
      coursesGrades[courseKey].grades.push(grade);
      coursesGrades[courseKey].total_grades++;
    }
    
    // Calcular promedio por curso
    for (const key in coursesGrades) {
      const gradesList = coursesGrades[key].grades;
      const sum = gradesList.reduce((acc, g) => acc + parseFloat(g.nota), 0);
      coursesGrades[key].average = parseFloat((sum / gradesList.length).toFixed(2));
    }
    
    // Agrupar por bimestre
    const gradesByBimestre = {};
    for (const grade of grades) {
      const bimestre = grade.bimestre || 1;
      if (!gradesByBimestre[bimestre]) {
        gradesByBimestre[bimestre] = {
          bimestre,
          grades: [],
          average: 0
        };
      }
      gradesByBimestre[bimestre].grades.push(grade);
    }
    
    for (const bim in gradesByBimestre) {
      const gradesList = gradesByBimestre[bim].grades;
      const sum = gradesList.reduce((acc, g) => acc + parseFloat(g.nota), 0);
      gradesByBimestre[bim].average = parseFloat((sum / gradesList.length).toFixed(2));
    }
    
    return {
      student: {
        id: student.id,
        ci: student.ci,
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.email,
        telefono: student.telefono,
        grado: student.grado,
        nivel: student.nivel,
        matricula: student.matricula
      },
      overall_average: parseFloat(average.toFixed(2)),
      total_grades: grades.length,
      courses: Object.values(coursesGrades),
      grades_by_bimestre: Object.values(gradesByBimestre).sort((a, b) => a.bimestre - b.bimestre),
      enrollments: student.enrollments || []
    };
  }

  async getCourseReport(courseId) {
    logger.info(`Generando reporte para curso ID: ${courseId}`);
    
    const course = await courseRepository.findWithDetails(courseId);
    if (!course) {
      throw new NotFoundError('Curso');
    }
    
    const grades = await gradeRepository.findByCourse(courseId);
    const statistics = await courseRepository.getCourseStatistics(courseId);
    
    // Agrupar notas por estudiante
    const studentsGrades = {};
    for (const grade of grades) {
      const studentKey = grade.student_id;
      if (!studentsGrades[studentKey]) {
        studentsGrades[studentKey] = {
          student: grade.student,
          grades: [],
          average: 0,
          total_grades: 0
        };
      }
      studentsGrades[studentKey].grades.push(grade);
      studentsGrades[studentKey].total_grades++;
    }
    
    // Calcular promedio por estudiante
    for (const key in studentsGrades) {
      const gradesList = studentsGrades[key].grades;
      const sum = gradesList.reduce((acc, g) => acc + parseFloat(g.nota), 0);
      studentsGrades[key].average = parseFloat((sum / gradesList.length).toFixed(2));
    }
    
    // Agrupar por tipo de evaluación
    const gradesByType = {};
    for (const grade of grades) {
      const type = grade.tipo_evaluacion;
      if (!gradesByType[type]) {
        gradesByType[type] = {
          tipo: type,
          grades: [],
          average: 0,
          count: 0
        };
      }
      gradesByType[type].grades.push(grade);
      gradesByType[type].count++;
    }
    
    for (const type in gradesByType) {
      const gradesList = gradesByType[type].grades;
      const sum = gradesList.reduce((acc, g) => acc + parseFloat(g.nota), 0);
      gradesByType[type].average = parseFloat((sum / gradesList.length).toFixed(2));
    }
    
    return {
      course: {
        id: course.id,
        nombre: course.nombre,
        grado: course.grado,
        paralelo: course.paralelo,
        gestion: course.gestion,
        turno: course.turno,
        subject: course.subject,
        teacher: course.teacher ? `${course.teacher.nombre} ${course.teacher.apellido}` : 'Sin asignar'
      },
      statistics: {
        total_grades: statistics.total,
        average: parseFloat(statistics.average.toFixed(2)),
        max: parseFloat(statistics.max.toFixed(2)),
        min: parseFloat(statistics.min.toFixed(2)),
        approved: statistics.approved,
        failed: statistics.failed,
        approval_rate: statistics.total > 0 ? parseFloat(((statistics.approved / statistics.total) * 100).toFixed(2)) : 0
      },
      students: Object.values(studentsGrades).sort((a, b) => b.average - a.average),
      grades_by_type: Object.values(gradesByType)
    };
  }

  async getPerformanceReport(gestion = null, grado = null) {
    logger.info(`Generando reporte de rendimiento para gestión: ${gestion}, grado: ${grado}`);
    
    const where = {};
    if (gestion) where.gestion = parseInt(gestion);
    if (grado) where.grado = parseInt(grado);
    
    const courses = await courseRepository.findAllWithDetails({ where });
    
    const performanceData = [];
    let totalStudents = 0;
    let totalApproved = 0;
    let totalFailed = 0;
    let totalGrades = 0;
    
    for (const course of courses) {
      const stats = await courseRepository.getCourseStatistics(course.id);
      const enrollments = await courseRepository.getCourseStudents(course.id);
      
      if (stats.total > 0) {
        performanceData.push({
          course: {
            id: course.id,
            nombre: course.nombre,
            grado: course.grado,
            paralelo: course.paralelo,
            subject: course.subject?.nombre || 'Sin materia',
            teacher: course.teacher ? `${course.teacher.nombre} ${course.teacher.apellido}` : 'Sin asignar'
          },
          statistics: {
            average: parseFloat(stats.average.toFixed(2)),
            approved: stats.approved,
            failed: stats.failed,
            total: stats.total,
            approval_rate: parseFloat(((stats.approved / stats.total) * 100).toFixed(2))
          },
          students_count: enrollments.length
        });
        
        totalStudents += enrollments.length;
        totalApproved += stats.approved;
        totalFailed += stats.failed;
        totalGrades += stats.total;
      }
    }
    
    // Ordenar por promedio descendente
    performanceData.sort((a, b) => b.statistics.average - a.statistics.average);
    
    return {
      summary: {
        gestion: gestion || 'Todas',
        grado: grado || 'Todos',
        total_courses: courses.length,
        total_students: totalStudents,
        total_grades: totalGrades,
        total_approved: totalApproved,
        total_failed: totalFailed,
        overall_average: totalGrades > 0 ? parseFloat((totalApproved / totalGrades * 100).toFixed(2)) : 0,
        overall_approval_rate: totalStudents > 0 ? parseFloat(((totalApproved / totalStudents) * 100).toFixed(2)) : 0
      },
      courses: performanceData
    };
  }

  async getTeacherReport(teacherId, gestion = null) {
    logger.info(`Generando reporte para docente ID: ${teacherId}`);
    
    const teacher = await userRepository.findById(teacherId);
    if (!teacher) {
      throw new NotFoundError('Docente');
    }
    
    const courses = await courseRepository.findByTeacher(teacherId, gestion);
    
    const coursesData = [];
    let totalStudents = 0;
    let totalGrades = 0;
    let totalAverage = 0;
    let totalApproved = 0;
    
    for (const course of courses) {
      const stats = await courseRepository.getCourseStatistics(course.id);
      const students = await courseRepository.getCourseStudents(course.id);
      
      coursesData.push({
        course: {
          id: course.id,
          nombre: course.nombre,
          subject: course.subject?.nombre,
          gestion: course.gestion,
          grado: course.grado,
          paralelo: course.paralelo
        },
        statistics: {
          average: parseFloat(stats.average.toFixed(2)),
          approved: stats.approved,
          failed: stats.failed,
          total: stats.total,
          approval_rate: stats.total > 0 ? parseFloat(((stats.approved / stats.total) * 100).toFixed(2)) : 0
        },
        students_count: students.length
      });
      
      totalStudents += students.length;
      totalGrades += stats.total;
      totalAverage += stats.average;
      totalApproved += stats.approved;
    }
    
    return {
      teacher: {
        id: teacher.id,
        nombre: teacher.nombre,
        apellido: teacher.apellido,
        email: teacher.email,
        especialidad: teacher.teacher?.especialidad || 'No especificada'
      },
      total_courses: courses.length,
      total_students: totalStudents,
      total_grades: totalGrades,
      overall_average: courses.length > 0 ? parseFloat((totalAverage / courses.length).toFixed(2)) : 0,
      overall_approval_rate: totalGrades > 0 ? parseFloat(((totalApproved / totalGrades) * 100).toFixed(2)) : 0,
      courses: coursesData.sort((a, b) => b.statistics.average - a.statistics.average)
    };
  }
}

module.exports = new ReportService();