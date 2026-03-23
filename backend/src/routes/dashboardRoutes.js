// backend/src/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ============================================
// DASHBOARD GENERAL (KPIs institucionales)
// ============================================

// Dashboard general con todos los KPIs
router.get('/general',
  roleMiddleware(['Administrador', 'Director']),
  dashboardController.validateGetGeneral(),
  dashboardController.getGeneralDashboard
);

// ============================================
// KPI 1: PROMEDIO GENERAL
// ============================================

// Promedio general de un estudiante
router.get('/student/:studentId/average',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getStudentOverallAverage
);

// Promedios de todos los estudiantes
router.get('/students/averages',
  roleMiddleware(['Administrador', 'Director']),
  dashboardController.validateGetGeneral(),
  dashboardController.getAllStudentsOverallAverage
);

// ============================================
// KPI 2: MATERIAS APROBADAS VS EN RIESGO
// ============================================

// Estado de materias de un estudiante
router.get('/student/:studentId/subjects-status',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getStudentSubjectStatus
);

// Estado de materias de todos los estudiantes
router.get('/students/subjects-status',
  roleMiddleware(['Administrador', 'Director']),
  dashboardController.validateGetGeneral(),
  dashboardController.getAllStudentsSubjectStatus
);

// ============================================
// KPI 3: PROMEDIO POR MATERIA
// ============================================

// Promedios por materia (general)
router.get('/subjects/averages',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  dashboardController.validateGetGeneral(),
  dashboardController.getAverageBySubject
);

// Promedios por materia de un estudiante
router.get('/student/:studentId/subjects-averages',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getStudentAverageBySubject
);

// ============================================
// KPI 4: EVOLUCIÓN DEL RENDIMIENTO
// ============================================

// Evolución de un estudiante
router.get('/student/:studentId/evolution',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getStudentEvolution
);

// Evolución de un curso
router.get('/course/:courseId/evolution',
  roleMiddleware(['Administrador', 'Director', 'Docente']),
  dashboardController.getCourseEvolution
);

// ============================================
// KPI 5: ALERTAS ACADÉMICAS
// ============================================

// Alertas de todos los estudiantes
router.get('/alerts',
  roleMiddleware(['Administrador', 'Director']),
  dashboardController.validateGetAlerts(),
  dashboardController.getAcademicAlerts
);

// Alertas de un estudiante específico
router.get('/student/:studentId/alerts',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getStudentAlerts
);

// ============================================
// DASHBOARD COMPLETO POR ESTUDIANTE
// ============================================

// Dashboard completo de un estudiante (todos los KPIs)
router.get('/student/:studentId/complete',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.getCompleteStudentDashboard
);

// ============================================
// EXPORTACIÓN DE REPORTES
// ============================================

// Exportar reporte de estudiante (JSON)
router.get('/student/:studentId/export',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.exportStudentReport
);

// Exportar reporte de estudiante (CSV)
router.get('/student/:studentId/export/csv',
  roleMiddleware(['Administrador', 'Director', 'Docente', 'Estudiante']),
  dashboardController.validateGetStudent(),
  dashboardController.exportStudentReportCSV
);

module.exports = router;