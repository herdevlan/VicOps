// backend/src/controllers/dashboardController.js
const BaseController = require('./baseController');
const dashboardService = require('../services/dashboardService');
const { param, query, validationResult } = require('express-validator');

class DashboardController extends BaseController {
  
  // ============================================
  // VALIDACIONES
  // ============================================

  validateGetStudent() {
    return [
      param('studentId').isInt().withMessage('studentId debe ser un número entero'),
      query('gestion').optional().isInt().withMessage('gestion debe ser un número')
    ];
  }

  validateGetAlerts() {
    return [
      query('threshold').optional().isInt({ min: 0, max: 100 }),
      query('gestion').optional().isInt(),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ];
  }

  validateGetGeneral() {
    return [
      query('gestion').optional().isInt()
    ];
  }

  // ============================================
  // KPI 1: PROMEDIO GENERAL DEL ESTUDIANTE
  // ============================================

  getStudentOverallAverage = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const data = await dashboardService.getStudentOverallAverage(studentId, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getAllStudentsOverallAverage = async (req, res, next) => {
    try {
      const { gestion } = req.query;
      const data = await dashboardService.getAllStudentsOverallAverage(gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // KPI 2: MATERIAS APROBADAS VS MATERIAS EN RIESGO
  // ============================================

  getStudentSubjectStatus = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion, threshold } = req.query;
      
      const data = await dashboardService.getStudentSubjectStatus(
        studentId, 
        gestion, 
        threshold || 51
      );
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getAllStudentsSubjectStatus = async (req, res, next) => {
    try {
      const { gestion, threshold } = req.query;
      const data = await dashboardService.getAllStudentsSubjectStatus(gestion, threshold || 51);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // KPI 3: PROMEDIO POR MATERIA
  // ============================================

  getAverageBySubject = async (req, res, next) => {
    try {
      const { gestion } = req.query;
      const data = await dashboardService.getAverageBySubject(gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getStudentAverageBySubject = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const data = await dashboardService.getStudentAverageBySubject(studentId, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // KPI 4: EVOLUCIÓN DEL RENDIMIENTO ACADÉMICO
  // ============================================

  getStudentEvolution = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const data = await dashboardService.getStudentEvolution(studentId, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getCourseEvolution = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { courseId } = req.params;
      const { gestion } = req.query;
      
      const data = await dashboardService.getCourseEvolution(courseId, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // KPI 5: ALERTAS ACADÉMICAS
  // ============================================

  getAcademicAlerts = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { threshold, gestion, limit } = req.query;
      
      const data = await dashboardService.getAcademicAlerts(
        threshold || 51,
        gestion,
        limit || 50
      );
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getStudentAlerts = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { threshold, gestion } = req.query;
      
      const data = await dashboardService.getStudentAlerts(studentId, threshold || 51, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // DASHBOARD COMPLETO
  // ============================================

  getCompleteStudentDashboard = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const data = await dashboardService.getCompleteStudentDashboard(studentId, gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  getGeneralDashboard = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { gestion } = req.query;
      const data = await dashboardService.getGeneralDashboard(gestion);
      return this.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // EXPORTACIÓN DE REPORTES
  // ============================================

  exportStudentReport = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const report = await dashboardService.exportStudentReport(studentId, gestion);
      return this.success(res, report);
    } catch (error) {
      next(error);
    }
  }

  exportStudentReportCSV = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return this.error(res, errors.array(), 400);
      }

      const { studentId } = req.params;
      const { gestion } = req.query;
      
      const dashboard = await dashboardService.getCompleteStudentDashboard(studentId, gestion);
      
      // Generar CSV
      let csv = '=== REPORTE ACADÉMICO ===\n';
      csv += `Estudiante,${dashboard.student.nombre} ${dashboard.student.apellido}\n`;
      csv += `CI,${dashboard.student.ci}\n`;
      csv += `Email,${dashboard.student.email || 'N/A'}\n`;
      csv += `Teléfono,${dashboard.student.telefono || 'N/A'}\n`;
      csv += `Gestión,${dashboard.gestion}\n`;
      csv += `Fecha,${new Date().toISOString()}\n\n`;
      
      csv += '=== KPIs PRINCIPALES ===\n';
      csv += `Promedio General,${dashboard.kpis.overallAverage}\n`;
      csv += `Materias Aprobadas,${dashboard.kpis.subjectSummary.approved}\n`;
      csv += `Materias en Riesgo,${dashboard.kpis.subjectSummary.atRisk}\n`;
      csv += `Tasa de Aprobación,${dashboard.kpis.subjectSummary.approvalRate.toFixed(1)}%\n\n`;
      
      csv += '=== PROMEDIO POR MATERIA ===\n';
      csv += 'Materia,Promedio,Estado\n';
      for (const subject of dashboard.kpis.averageBySubject) {
        csv += `${subject.subjectName},${subject.average},${subject.status}\n`;
      }
      csv += '\n';
      
      csv += '=== EVOLUCIÓN POR BIMESTRE ===\n';
      csv += 'Bimestre,Promedio\n';
      for (const bimestre of dashboard.kpis.evolution.bimestreData) {
        csv += `${bimestre.bimestre},${bimestre.average}\n`;
      }
      csv += '\n';
      
      csv += '=== ALERTAS ACADÉMICAS ===\n';
      csv += 'Materia,Promedio,Severidad\n';
      for (const alert of dashboard.kpis.alerts) {
        csv += `${alert.subjectName},${alert.average},${alert.severity}\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_estudiante_${studentId}.csv`);
      return res.send('\uFEFF' + csv);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();