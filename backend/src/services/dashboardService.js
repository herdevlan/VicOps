// backend/src/services/dashboardService.js
const dashboardRepository = require('../repositories/dashboardRepository');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class DashboardService {
  
  // ============================================
  // KPI 1: PROMEDIO GENERAL DEL ESTUDIANTE
  // ============================================

  async getStudentOverallAverage(studentId, gestion = null) {
    logger.info(`Obteniendo promedio general para estudiante ${studentId}`);
    
    const student = await dashboardRepository.getStudentOverallAverage(studentId, gestion);
    if (!student || student.totalGrades === 0) {
      return {
        studentId,
        average: 0,
        totalGrades: 0,
        message: 'No hay calificaciones registradas'
      };
    }
    
    return student;
  }

  async getAllStudentsOverallAverage(gestion = null) {
    logger.info(`Obteniendo promedios generales de todos los estudiantes para gestión: ${gestion || 'todas'}`);
    return await dashboardRepository.getAllStudentsOverallAverage(gestion);
  }

  // ============================================
  // KPI 2: MATERIAS APROBADAS VS MATERIAS EN RIESGO
  // ============================================

  async getStudentSubjectStatus(studentId, gestion = null, threshold = 51) {
    logger.info(`Obteniendo estado de materias para estudiante ${studentId}`);
    
    const result = await dashboardRepository.getStudentSubjectStatus(studentId, gestion, threshold);
    
    return {
      ...result,
      summary: {
        message: result.atRisk === 0 
          ? '✅ Todas las materias aprobadas' 
          : `⚠️ ${result.atRisk} materia(s) en riesgo de reprobación`,
        recommendation: result.atRisk > 0 
          ? 'Se recomienda reforzar las materias en riesgo con tutorías adicionales'
          : 'Excelente rendimiento académico. Continuar con el buen trabajo.'
      }
    };
  }

  async getAllStudentsSubjectStatus(gestion = null, threshold = 51) {
    logger.info(`Obteniendo estado de materias de todos los estudiantes`);
    return await dashboardRepository.getAllStudentsSubjectStatus(gestion, threshold);
  }

  // ============================================
  // KPI 3: PROMEDIO POR MATERIA
  // ============================================

  async getAverageBySubject(gestion = null) {
    logger.info(`Obteniendo promedios por materia para gestión: ${gestion || 'todas'}`);
    return await dashboardRepository.getAverageBySubject(gestion);
  }

  async getStudentAverageBySubject(studentId, gestion = null) {
    logger.info(`Obteniendo promedios por materia para estudiante ${studentId}`);
    
    const result = await dashboardRepository.getStudentAverageBySubject(studentId, gestion);
    
    // Identificar fortalezas y debilidades
    const strengths = result.filter(r => r.average >= 70);
    const weaknesses = result.filter(r => r.average < 51);
    
    return {
      subjects: result,
      strengths: {
        count: strengths.length,
        list: strengths.map(s => ({ subject: s.subjectName, average: s.average }))
      },
      weaknesses: {
        count: weaknesses.length,
        list: weaknesses.map(s => ({ subject: s.subjectName, average: s.average }))
      }
    };
  }

  // ============================================
  // KPI 4: EVOLUCIÓN DEL RENDIMIENTO ACADÉMICO
  // ============================================

  /**
   * Obtener evolución del rendimiento académico del estudiante por evaluaciones (1-6)
   * @param {number} studentId - ID del estudiante
   * @param {number} gestion - Gestión académica (opcional)
   */
  async getStudentEvolution(studentId, gestion = null) {
    logger.info(`Obteniendo evolución del rendimiento para estudiante ${studentId}`);
    
    // Intentar obtener del repositorio si tiene el método actualizado
    try {
      if (dashboardRepository.getStudentEvolutionByEvaluaciones) {
        const result = await dashboardRepository.getStudentEvolutionByEvaluaciones(studentId, gestion);
        if (result && result.evaluaciones && result.evaluaciones.length > 0) {
          return this.processEvolutionData(result);
        }
      }
    } catch (error) {
      logger.warn('Método getStudentEvolutionByEvaluaciones no disponible, usando cálculo manual');
    }
    
    // Fallback: cálculo manual de evolución por evaluaciones
    const { Grade, Course } = require('../models');
    const { Op } = require('sequelize');
    
    const whereGrade = { student_id: studentId };
    const whereCourse = {};
    
    if (gestion) {
      whereCourse.gestion = gestion;
    }
    
    const grades = await Grade.findAll({
      where: whereGrade,
      include: [{
        model: Course,
        as: 'course',
        where: gestion ? whereCourse : {},
        attributes: ['gestion', 'nombre', 'grado']
      }],
      attributes: ['nota', 'evaluacion_numero', 'tipo_evaluacion', 'porcentaje', 'fecha']
    });
    
    if (!grades || grades.length === 0) {
      return {
        evaluaciones: [],
        trend: 'sin_datos',
        lastAverage: 0,
        hasData: false,
        analysis: 'No hay calificaciones registradas para este periodo'
      };
    }
    
    // Agrupar por número de evaluación (1-6)
    const evaluacionesMap = {};
    for (const grade of grades) {
      const evalNum = grade.evaluacion_numero || 0;
      if (evalNum === 0) continue;
      
      if (!evaluacionesMap[evalNum]) {
        evaluacionesMap[evalNum] = {
          evaluacion: evalNum,
          tipo: grade.tipo_evaluacion || `Evaluación ${evalNum}`,
          notas: [],
          porcentajes: []
        };
      }
      evaluacionesMap[evalNum].notas.push(parseFloat(grade.nota));
      if (grade.porcentaje) {
        evaluacionesMap[evalNum].porcentajes.push(grade.porcentaje);
      }
    }
    
    // Construir array de evolución para evaluaciones 1 a 6
    const evolution = [];
    for (let i = 1; i <= 6; i++) {
      const ev = evaluacionesMap[i];
      if (ev && ev.notas.length > 0) {
        const average = ev.notas.reduce((a, b) => a + b, 0) / ev.notas.length;
        const weightedAverage = this.calculateWeightedAverage(ev.notas, ev.porcentajes);
        
        evolution.push({
          evaluacion: i,
          tipo: ev.tipo,
          average: parseFloat(average.toFixed(2)),
          weightedAverage: weightedAverage ? parseFloat(weightedAverage.toFixed(2)) : null,
          totalGrades: ev.notas.length,
          notas: ev.notas
        });
      } else {
        evolution.push({
          evaluacion: i,
          tipo: `Evaluación ${i}`,
          average: 0,
          totalGrades: 0
        });
      }
    }
    
    // Filtrar solo evaluaciones con datos
    const evaluacionesConDatos = evolution.filter(e => e.totalGrades > 0);
    
    // Calcular tendencia
    const trend = this.calculateTrend(evolution);
    
    // Análisis de evolución
    let analysis = '';
    if (evaluacionesConDatos.length >= 2) {
      const first = evaluacionesConDatos[0].average;
      const last = evaluacionesConDatos[evaluacionesConDatos.length - 1].average;
      const improvement = last - first;
      
      if (improvement > 5) {
        analysis = `📈 Rendimiento en mejora constante. Aumento de ${improvement.toFixed(1)} puntos porcentuales entre la evaluación ${evaluacionesConDatos[0].evaluacion} y ${evaluacionesConDatos[evaluacionesConDatos.length - 1].evaluacion}.`;
      } else if (improvement < -5) {
        analysis = `📉 Rendimiento en descenso. Disminución de ${Math.abs(improvement).toFixed(1)} puntos. Se recomienda revisar metodología de estudio.`;
      } else {
        analysis = `➡️ Rendimiento estable. Variación de ${improvement.toFixed(1)} puntos.`;
      }
    } else if (evaluacionesConDatos.length === 1) {
      analysis = `ℹ️ Solo se tiene registro de la evaluación ${evaluacionesConDatos[0].evaluacion}. Se necesitan más datos para analizar la tendencia.`;
    }
    
    return {
      evaluaciones: evaluacionesConDatos,
      trend,
      lastAverage: evaluacionesConDatos.length > 0 ? evaluacionesConDatos[evaluacionesConDatos.length - 1].average : 0,
      hasData: evaluacionesConDatos.length > 0,
      analysis,
      totalEvaluaciones: evaluacionesConDatos.length
    };
  }

  /**
   * Calcular promedio ponderado basado en porcentajes
   */
  calculateWeightedAverage(notas, porcentajes) {
    if (!porcentajes || porcentajes.length === 0 || notas.length !== porcentajes.length) {
      return null;
    }
    let total = 0;
    let sumPorcentajes = 0;
    for (let i = 0; i < notas.length; i++) {
      total += notas[i] * (porcentajes[i] / 100);
      sumPorcentajes += porcentajes[i];
    }
    return sumPorcentajes > 0 ? (total / sumPorcentajes) * 100 : null;
  }

  /**
   * Calcular tendencia basada en evolución
   */
  calculateTrend(evolution) {
    const evaluacionesConDatos = evolution.filter(e => e.totalGrades > 0);
    if (evaluacionesConDatos.length < 2) return 'sin_suficientes_datos';
    
    const first = evaluacionesConDatos[0].average;
    const last = evaluacionesConDatos[evaluacionesConDatos.length - 1].average;
    const improvement = last - first;
    
    if (improvement > 3) return 'mejorando';
    if (improvement < -3) return 'empeorando';
    return 'estable';
  }

  /**
   * Procesar datos de evolución del repositorio
   */
  processEvolutionData(result) {
    const evolution = result.evaluaciones || [];
    const trend = this.calculateTrendFromArray(evolution);
    
    let analysis = '';
    if (evolution.length >= 2) {
      const first = evolution[0].average;
      const last = evolution[evolution.length - 1].average;
      const improvement = last - first;
      
      if (improvement > 5) {
        analysis = `📈 Rendimiento en mejora constante. Aumento de ${improvement.toFixed(1)} puntos porcentuales.`;
      } else if (improvement < -5) {
        analysis = `📉 Rendimiento en descenso. Disminución de ${Math.abs(improvement).toFixed(1)} puntos.`;
      } else {
        analysis = `➡️ Rendimiento estable. Variación de ${improvement.toFixed(1)} puntos.`;
      }
    }
    
    return {
      evaluaciones: evolution,
      trend,
      lastAverage: evolution.length > 0 ? evolution[evolution.length - 1].average : 0,
      hasData: evolution.length > 0,
      analysis,
      totalEvaluaciones: evolution.length
    };
  }

  /**
   * Calcular tendencia desde array de evaluaciones
   */
  calculateTrendFromArray(evaluaciones) {
    if (evaluaciones.length < 2) return 'sin_suficientes_datos';
    
    const first = evaluaciones[0].average;
    const last = evaluaciones[evaluaciones.length - 1].average;
    const improvement = last - first;
    
    if (improvement > 3) return 'mejorando';
    if (improvement < -3) return 'empeorando';
    return 'estable';
  }

  async getCourseEvolution(courseId, gestion = null) {
    logger.info(`Obteniendo evolución del curso ${courseId}`);
    return await dashboardRepository.getCourseEvolution(courseId, gestion);
  }

  // ============================================
  // KPI 5: ALERTAS ACADÉMICAS (MATERIAS EN RIESGO)
  // ============================================

  async getAcademicAlerts(threshold = 51, gestion = null, limit = 50) {
    logger.info(`Obteniendo alertas académicas (threshold: ${threshold})`);
    
    const result = await dashboardRepository.getAcademicAlerts(threshold, gestion, limit);
    
    // Agregar resumen de alertas por severidad
    const critical = result.alerts.filter(a => a.severity === 'critico').length;
    const alert = result.alerts.filter(a => a.severity === 'alerta').length;
    
    return {
      ...result,
      summary: {
        total: result.total,
        critical,
        alert,
        message: result.total === 0 
          ? '✅ No hay alertas académicas activas' 
          : `⚠️ ${result.total} alertas académicas activas (${critical} críticas, ${alert} en alerta)`
      }
    };
  }

  async getStudentAlerts(studentId, threshold = 51, gestion = null) {
    logger.info(`Obteniendo alertas para estudiante ${studentId}`);
    return await dashboardRepository.getStudentAlerts(studentId, threshold, gestion);
  }

  // ============================================
  // DASHBOARD COMPLETO
  // ============================================

  async getCompleteStudentDashboard(studentId, gestion = null) {
    logger.info(`Generando dashboard completo para estudiante ${studentId}`);
    
    // Verificar que el estudiante existe
    const student = await dashboardRepository.getStudentOverallAverage(studentId);
    if (!student && student.totalGrades === 0) {
      const Student = require('../models').Student;
      const existingStudent = await Student.findByPk(studentId);
      if (!existingStudent) {
        throw new NotFoundError('Estudiante');
      }
    }
    
    return await dashboardRepository.getCompleteStudentDashboard(studentId, gestion);
  }

  async getGeneralDashboard(gestion = null) {
    logger.info(`Generando dashboard general para gestión: ${gestion || 'todas'}`);
    return await dashboardRepository.getGeneralDashboard(gestion);
  }

  // ============================================
  // EXPORTACIÓN DE REPORTES
  // ============================================

  async exportStudentReport(studentId, gestion = null) {
    const dashboard = await this.getCompleteStudentDashboard(studentId, gestion);
    
    return {
      title: `Reporte Académico - ${dashboard.student.nombre} ${dashboard.student.apellido}`,
      generatedAt: new Date().toISOString(),
      student: dashboard.student,
      kpis: dashboard.kpis,
      recomendaciones: this.generateRecommendations(dashboard.kpis)
    };
  }

  generateRecommendations(kpis) {
    const recommendations = [];
    
    // Recomendaciones basadas en promedio general
    if (kpis.overallAverage < 51) {
      recommendations.push('⚠️ Promedio general por debajo del mínimo. Se recomienda evaluación psicopedagógica.');
    } else if (kpis.overallAverage < 70) {
      recommendations.push('📚 Promedio general en nivel básico. Reforzar hábitos de estudio.');
    } else if (kpis.overallAverage >= 85) {
      recommendations.push('🏆 Excelente rendimiento académico. Considerar participación en olimpiadas o programas de excelencia.');
    }
    
    // Recomendaciones basadas en materias en riesgo
    if (kpis.subjectSummary && kpis.subjectSummary.atRisk > 0) {
      recommendations.push(`📖 Atención prioritaria en ${kpis.subjectSummary.atRisk} materia(s) en riesgo. Programar tutorías personalizadas.`);
    }
    
    // Recomendaciones basadas en evolución
    if (kpis.evolution && kpis.evolution.trend === 'empeorando') {
      recommendations.push('📉 Tendencia descendente detectada. Revisar metodología de estudio y asistencia a clases.');
    } else if (kpis.evolution && kpis.evolution.trend === 'mejorando') {
      recommendations.push('📈 Tendencia positiva. Mantener el esfuerzo y la dedicación.');
    }
    
    return recommendations;
  }
}

module.exports = new DashboardService();