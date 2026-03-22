// backend/src/controllers/reportController.js
const BaseController = require('./baseController');
const reportService = require('../services/reportService');
const { param, query, validationResult } = require('express-validator');

class ReportController extends BaseController {
  constructor() {
    super(reportService);
  }

  validateGetDashboard() {
    return [
      query('gestion').optional().isInt().withMessage('gestion debe ser un número')
    ];
  }

  validateGetStudentReport() {
    return [
      param('studentId').isInt().withMessage('studentId debe ser un número entero')
    ];
  }

  validateGetCourseReport() {
    return [
      param('courseId').isInt().withMessage('courseId debe ser un número entero')
    ];
  }

  validateGetPerformanceReport() {
    return [
      query('gestion').optional().isInt().withMessage('gestion debe ser un número'),
      query('grado').optional().isInt().withMessage('grado debe ser un número')
    ];
  }

  validateGetTeacherReport() {
    return [
      param('teacherId').isInt().withMessage('teacherId debe ser un número entero'),
      query('gestion').optional().isInt().withMessage('gestion debe ser un número')
    ];
  }

  async getDashboardStats(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { gestion } = req.query;
      const stats = await reportService.getDashboardStats(gestion);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error en getDashboardStats:', error);
      next(error);
    }
  }

  async getStudentReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { studentId } = req.params;
      const report = await reportService.getStudentReport(studentId);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error en getStudentReport:', error);
      next(error);
    }
  }

  async getCourseReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { courseId } = req.params;
      const report = await reportService.getCourseReport(courseId);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error en getCourseReport:', error);
      next(error);
    }
  }

  async getPerformanceReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { gestion, grado } = req.query;
      const report = await reportService.getPerformanceReport(gestion, grado);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error en getPerformanceReport:', error);
      next(error);
    }
  }

  async getTeacherReport(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { teacherId } = req.params;
      const { gestion } = req.query;
      const report = await reportService.getTeacherReport(teacherId, gestion);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error en getTeacherReport:', error);
      next(error);
    }
  }
}

module.exports = new ReportController();