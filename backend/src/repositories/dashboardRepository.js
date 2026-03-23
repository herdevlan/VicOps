const { sequelize, Student, Course, Enrollment, Grade, Subject, User } = require('../models');
const { Op } = require('sequelize');

class DashboardRepository {
  
  // ============================================
  // KPI 1: PROMEDIO GENERAL DEL ESTUDIANTE
  // ============================================

  async getStudentOverallAverage(studentId, gestion = null) {
    const whereGrade = { student_id: studentId };
    
    const grades = await Grade.findAll({
      where: whereGrade,
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {},
        attributes: ['gestion']
      }],
      attributes: ['nota']
    });
    
    const notas = grades.map(g => parseFloat(g.nota));
    const average = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
    
    return {
      studentId,
      average: parseFloat(average.toFixed(2)),
      totalGrades: notas.length,
      gestion: gestion || 'todas'
    };
  }

  async getAllStudentsOverallAverage(gestion = null) {
    const grades = await Grade.findAll({
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {},
        attributes: ['gestion']
      }],
      attributes: ['student_id', 'nota']
    });
    
    const studentAverages = {};
    for (const grade of grades) {
      const studentId = grade.student_id;
      if (!studentAverages[studentId]) {
        studentAverages[studentId] = [];
      }
      studentAverages[studentId].push(parseFloat(grade.nota));
    }
    
    const result = [];
    for (const studentId in studentAverages) {
      const notas = studentAverages[studentId];
      const average = notas.reduce((a, b) => a + b, 0) / notas.length;
      result.push({
        studentId: parseInt(studentId),
        average: parseFloat(average.toFixed(2)),
        totalGrades: notas.length
      });
    }
    
    return result;
  }

  // ============================================
  // KPI 2: MATERIAS APROBADAS VS MATERIAS EN RIESGO
  // ============================================

  async getStudentSubjectStatus(studentId, gestion = null, threshold = 51) {
    const grades = await Grade.findAll({
      where: { student_id: studentId },
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {},
        include: [{ model: Subject, as: 'subject' }]
      }]
    });
    
    const subjectResults = {};
    for (const grade of grades) {
      if (!grade.course || !grade.course.subject) continue;
      
      const subjectId = grade.course.subject.id;
      const subjectName = grade.course.subject.nombre;
      
      if (!subjectResults[subjectId]) {
        subjectResults[subjectId] = {
          subjectId,
          subjectName,
          notas: []
        };
      }
      subjectResults[subjectId].notas.push(parseFloat(grade.nota));
    }
    
    const results = [];
    for (const subjectId in subjectResults) {
      const notas = subjectResults[subjectId].notas;
      const average = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      
      results.push({
        subjectId: parseInt(subjectId),
        subjectName: subjectResults[subjectId].subjectName,
        average: parseFloat(average.toFixed(2)),
        status: average >= threshold ? 'aprobado' : 'riesgo',
        gradeCount: notas.length
      });
    }
    
    const approved = results.filter(s => s.status === 'aprobado').length;
    const atRisk = results.filter(s => s.status === 'riesgo').length;
    
    return {
      studentId,
      gestion: gestion || 'todas',
      totalSubjects: results.length,
      approved,
      atRisk,
      subjects: results,
      approvalRate: results.length > 0 ? (approved / results.length) * 100 : 0
    };
  }

  async getAllStudentsSubjectStatus(gestion = null, threshold = 51) {
    const allStudents = await Student.findAll({
      include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido'] }],
      where: { estado: true }
    });
    
    const results = [];
    for (const student of allStudents) {
      const status = await this.getStudentSubjectStatus(student.id, gestion, threshold);
      results.push({
        studentId: student.id,
        studentName: `${student.nombre} ${student.apellido}`,
        ...status
      });
    }
    
    return results;
  }

  // ============================================
  // KPI 3: PROMEDIO POR MATERIA
  // ============================================

  async getAverageBySubject(gestion = null) {
    const whereCourse = gestion ? { gestion } : {};
    
    const courses = await Course.findAll({
      where: whereCourse,
      include: [
        { model: Subject, as: 'subject', attributes: ['id', 'nombre', 'area_conocimiento'] },
        { model: Grade, as: 'grades', attributes: ['nota'] }
      ]
    });
    
    const subjectAverages = {};
    for (const course of courses) {
      if (!course.subject) continue;
      
      const subjectId = course.subject.id;
      const subjectName = course.subject.nombre;
      const area = course.subject.area_conocimiento;
      
      if (!subjectAverages[subjectId]) {
        subjectAverages[subjectId] = {
          subjectId,
          subjectName,
          area,
          notas: [],
          courseCount: 0
        };
      }
      
      const notas = course.grades ? course.grades.map(g => parseFloat(g.nota)) : [];
      subjectAverages[subjectId].notas.push(...notas);
      subjectAverages[subjectId].courseCount++;
    }
    
    const result = [];
    for (const subjectId in subjectAverages) {
      const notas = subjectAverages[subjectId].notas;
      const average = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
      const approved = notas.filter(n => n >= 51).length;
      const failed = notas.filter(n => n < 51).length;
      
      result.push({
        subjectId: parseInt(subjectId),
        subjectName: subjectAverages[subjectId].subjectName,
        area: subjectAverages[subjectId].area,
        average: parseFloat(average.toFixed(2)),
        totalGrades: notas.length,
        approved,
        failed,
        approvalRate: notas.length > 0 ? (approved / notas.length) * 100 : 0,
        courseCount: subjectAverages[subjectId].courseCount
      });
    }
    
    return result.sort((a, b) => b.average - a.average);
  }

  async getStudentAverageBySubject(studentId, gestion = null) {
    const grades = await Grade.findAll({
      where: { student_id: studentId },
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {},
        include: [{ model: Subject, as: 'subject' }]
      }]
    });
    
    const subjectAverages = {};
    for (const grade of grades) {
      if (!grade.course || !grade.course.subject) continue;
      
      const subjectId = grade.course.subject.id;
      const subjectName = grade.course.subject.nombre;
      
      if (!subjectAverages[subjectId]) {
        subjectAverages[subjectId] = {
          subjectId,
          subjectName,
          notas: []
        };
      }
      subjectAverages[subjectId].notas.push(parseFloat(grade.nota));
    }
    
    const result = [];
    for (const subjectId in subjectAverages) {
      const notas = subjectAverages[subjectId].notas;
      const average = notas.reduce((a, b) => a + b, 0) / notas.length;
      const status = average >= 51 ? 'aprobado' : 'riesgo';
      
      result.push({
        subjectId: parseInt(subjectId),
        subjectName: subjectAverages[subjectId].subjectName,
        average: parseFloat(average.toFixed(2)),
        totalGrades: notas.length,
        status
      });
    }
    
    return result.sort((a, b) => b.average - a.average);
  }

  // ============================================
  // KPI 4: EVOLUCIÓN DEL RENDIMIENTO ACADÉMICO
  // ============================================

  async getStudentEvolution(studentId, gestion = null) {
    const grades = await Grade.findAll({
      where: { student_id: studentId },
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {},
        include: [{ model: Subject, as: 'subject' }]
      }],
      order: [['evaluacion_numero', 'ASC']]
    });
    
    const evaluacionData = {};
    for (const grade of grades) {
      const evaluacion = grade.evaluacion_numero;
      if (evaluacion) {
        if (!evaluacionData[evaluacion]) {
          evaluacionData[evaluacion] = {
            evaluacion: evaluacion,
            notas: []
          };
        }
        evaluacionData[evaluacion].notas.push(parseFloat(grade.nota));
      }
    }
    
    const evaluacionEvolution = [];
    for (let i = 1; i <= 6; i++) {
      const data = evaluacionData[i];
      const average = data && data.notas.length > 0 
        ? data.notas.reduce((a, b) => a + b, 0) / data.notas.length 
        : 0;
      
      evaluacionEvolution.push({
        evaluacion: i,
        average: parseFloat(average.toFixed(2)),
        totalGrades: data ? data.notas.length : 0
      });
    }
    
    const averages = evaluacionEvolution.filter(e => e.totalGrades > 0).map(e => e.average);
    let trend = 'estable';
    if (averages.length >= 2) {
      const first = averages[0];
      const last = averages[averages.length - 1];
      if (last > first + 5) trend = 'mejorando';
      else if (last < first - 5) trend = 'empeorando';
    }
    
    return {
      studentId,
      gestion: gestion || 'todas',
      evaluacionEvolution,
      trend,
      lastAverage: evaluacionEvolution.filter(e => e.totalGrades > 0).pop()?.average || 0
    };
  }

  async getCourseEvolution(courseId, gestion = null) {
    const whereGrade = {};
    if (courseId) whereGrade.course_id = courseId;
    
    const grades = await Grade.findAll({
      where: whereGrade,
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? { gestion } : {}
      }],
      order: [['evaluacion_numero', 'ASC']]
    });
    
    const evaluacionData = {};
    for (const grade of grades) {
      const evaluacion = grade.evaluacion_numero;
      if (evaluacion) {
        if (!evaluacionData[evaluacion]) {
          evaluacionData[evaluacion] = {
            evaluacion: evaluacion,
            notas: []
          };
        }
        evaluacionData[evaluacion].notas.push(parseFloat(grade.nota));
      }
    }
    
    const evaluacionEvolution = [];
    for (let i = 1; i <= 6; i++) {
      const data = evaluacionData[i];
      const average = data && data.notas.length > 0 
        ? data.notas.reduce((a, b) => a + b, 0) / data.notas.length 
        : 0;
      
      evaluacionEvolution.push({
        evaluacion: i,
        average: parseFloat(average.toFixed(2)),
        totalGrades: data ? data.notas.length : 0
      });
    }
    
    return {
      courseId,
      gestion: gestion || 'todas',
      evaluacionEvolution
    };
  }

  // ============================================
  // KPI 5: ALERTAS ACADÉMICAS (MATERIAS EN RIESGO)
  // ============================================

  async getAcademicAlerts(threshold = 51, gestion = null, limit = 50) {
    const students = await Student.findAll({
      include: [{ model: User, as: 'user', attributes: ['nombre', 'apellido', 'email'] }],
      where: { estado: true }
    });
    
    const alerts = [];
    
    for (const student of students) {
      const subjectStatus = await this.getStudentSubjectStatus(student.id, gestion, threshold);
      const atRiskSubjects = subjectStatus.subjects.filter(s => s.status === 'riesgo');
      
      for (const subject of atRiskSubjects) {
        alerts.push({
          id: `${student.id}_${subject.subjectId}`,
          studentId: student.id,
          studentName: `${student.nombre} ${student.apellido}`,
          studentCI: student.ci,
          studentEmail: student.user?.email,
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          average: subject.average,
          threshold,
          status: 'riesgo',
          severity: subject.average < 40 ? 'critico' : (subject.average < 51 ? 'alerta' : 'normal'),
          createdAt: new Date()
        });
      }
    }
    
    alerts.sort((a, b) => a.average - b.average);
    
    return {
      total: alerts.length,
      threshold,
      gestion: gestion || 'todas',
      alerts: alerts.slice(0, limit)
    };
  }

  async getStudentAlerts(studentId, threshold = 51, gestion = null) {
    const subjectStatus = await this.getStudentSubjectStatus(studentId, gestion, threshold);
    const atRiskSubjects = subjectStatus.subjects.filter(s => s.status === 'riesgo');
    
    const alerts = atRiskSubjects.map(subject => ({
      studentId,
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      average: subject.average,
      threshold,
      status: 'riesgo',
      severity: subject.average < 40 ? 'critico' : 'alerta'
    }));
    
    return {
      studentId,
      total: alerts.length,
      alerts
    };
  }

  // ============================================
  // DASHBOARD COMPLETO (TODOS LOS KPIs)
  // ============================================

  async getCompleteStudentDashboard(studentId, gestion = null) {
    const [
      overallAverage,
      subjectStatus,
      averageBySubject,
      evolution,
      alerts
    ] = await Promise.all([
      this.getStudentOverallAverage(studentId, gestion),
      this.getStudentSubjectStatus(studentId, gestion, 51),
      this.getStudentAverageBySubject(studentId, gestion),
      this.getStudentEvolution(studentId, gestion),
      this.getStudentAlerts(studentId, 51, gestion)
    ]);
    
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user', attributes: ['email', 'telefono'] }]
    });
    
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }
    
    return {
      student: {
        id: student.id,
        ci: student.ci,
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.user?.email,
        telefono: student.telefono
      },
      gestion: gestion || 'actual',
      kpis: {
        overallAverage: overallAverage.average,
        subjectSummary: {
          total: subjectStatus.totalSubjects,
          approved: subjectStatus.approved,
          atRisk: subjectStatus.atRisk,
          approvalRate: subjectStatus.approvalRate
        },
        averageBySubject,
        evolution: {
          evaluacionData: evolution.evaluacionEvolution,
          trend: evolution.trend,
          lastAverage: evolution.lastAverage
        },
        alerts: alerts.alerts
      }
    };
  }

  // ============================================
  // DASHBOARD GENERAL (ADMIN) - CORREGIDO
  // ============================================

  async getGeneralDashboard(gestion = null) {
    const [
      overallAverages,
      subjectStatusSummary,
      averageBySubject,
      courseEvolution,
      alerts,
      totalStudentsCount
    ] = await Promise.all([
      this.getAllStudentsOverallAverage(gestion),
      this.getAllStudentsSubjectStatus(gestion, 51),
      this.getAverageBySubject(gestion),
      this.getCourseEvolution(null, gestion),
      this.getAcademicAlerts(51, gestion, 20),
      // Contar TODOS los estudiantes (incluyendo los que no tienen notas)
      sequelize.query(`SELECT COUNT(*) as total FROM students`, { type: sequelize.QueryTypes.SELECT })
    ]);
    
    const totalAverage = overallAverages.length > 0
      ? overallAverages.reduce((sum, s) => sum + s.average, 0) / overallAverages.length
      : 0;
    
    const totalSubjects = subjectStatusSummary.reduce((sum, s) => sum + s.totalSubjects, 0);
    const totalApproved = subjectStatusSummary.reduce((sum, s) => sum + s.approved, 0);
    const totalAtRisk = subjectStatusSummary.reduce((sum, s) => sum + s.atRisk, 0);
    
    // Total de estudiantes REAL (33 según tu base de datos)
    const totalStudents = totalStudentsCount[0]?.total || 0;
    
    return {
      gestion: gestion || 'todas',
      generatedAt: new Date().toISOString(),
      kpis: {
        overallAverage: parseFloat(totalAverage.toFixed(2)),
        totalStudents: totalStudents,  // AHORA SÍ: 33
        subjectSummary: {
          total: totalSubjects,
          approved: totalApproved,
          atRisk: totalAtRisk,
          approvalRate: totalSubjects > 0 ? (totalApproved / totalSubjects) * 100 : 0
        },
        averageBySubject,
        evolution: courseEvolution.evaluacionEvolution || [],
        alerts: alerts.alerts
      }
    };
  }
}

module.exports = new DashboardRepository();