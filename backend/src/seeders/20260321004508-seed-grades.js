'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const enrollments = await queryInterface.sequelize.query(
      `SELECT e.student_id, e.course_id, c.subject_id, c.grado
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.estado = 'activo'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role_id IN (1, 2) LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const userId = users[0]?.id || 1;
    
    // Tipos de evaluación válidos según tu ENUM
    const tiposEvaluacion = [
      'primer_parcial',
      'segundo_parcial',
      'tercer_parcial',
      'final',
      'trabajo',
      'examen'
    ];
    
    const gradesToInsert = [];
    
    for (const enrollment of enrollments) {
      for (let evaluacionNumero = 1; evaluacionNumero <= 6; evaluacionNumero++) {
        const tipoEvaluacion = tiposEvaluacion[(evaluacionNumero - 1) % tiposEvaluacion.length];
        
        // Nota con variación realista
        let notaBase = 60 + Math.random() * 35;
        
        if (enrollment.grado === 2) {
          notaBase = notaBase - 5;
        }
        
        if (tipoEvaluacion === 'final' || tipoEvaluacion === 'examen') {
          notaBase = notaBase * 0.9;
        } else if (tipoEvaluacion === 'trabajo') {
          notaBase = notaBase * 1.05;
        }
        
        const nota = Math.min(100, Math.max(0, Math.round(notaBase * 10) / 10));
        
        gradesToInsert.push({
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          nota: nota,
          tipo_evaluacion: tipoEvaluacion,
          evaluacion_numero: evaluacionNumero,
          porcentaje: evaluacionNumero === 6 ? 30 : 14,
          fecha: new Date(),
          observacion: nota >= 70 ? 'Aprobado' : (nota >= 51 ? 'En proceso' : 'Requiere recuperación'),
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (gradesToInsert.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < gradesToInsert.length; i += batchSize) {
        const batch = gradesToInsert.slice(i, i + batchSize);
        await queryInterface.bulkInsert('grades', batch, {});
      }
      console.log(`✅ Insertadas ${gradesToInsert.length} calificaciones`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('grades', null, {});
  }
};