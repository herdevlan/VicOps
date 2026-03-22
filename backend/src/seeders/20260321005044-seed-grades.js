'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener estudiantes existentes
    const students = await queryInterface.sequelize.query(
      `SELECT id, user_id, nombre, apellido FROM students WHERE estado = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (students.length === 0) {
      console.log('⚠️ No hay estudiantes registrados, no se pueden insertar notas');
      return;
    }
    
    // Obtener cursos existentes
    const courses = await queryInterface.sequelize.query(
      `SELECT id, nombre, grado, paralelo FROM courses WHERE estado = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (courses.length === 0) {
      console.log('⚠️ No hay cursos registrados, no se pueden insertar notas');
      return;
    }
    
    // Obtener usuarios docentes o admin para user_id
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role_id IN (1, 3) LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const userId = users.length > 0 ? users[0].id : 1;
    
    // Verificar notas existentes para evitar duplicados
    const existingGrades = await queryInterface.sequelize.query(
      `SELECT student_id, course_id, tipo_evaluacion, bimestre FROM grades`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const gradesToInsert = [];
    
    // ✅ CORREGIDO con los valores correctos del enum
    const tiposEvaluacion = [
      'primer_parcial',
      'segundo_parcial',
      'tercer_parcial',
      'final',
      'trabajo',
      'examen'
    ];
    
    // Bimestres
    const bimestres = [1, 2, 3, 4];
    
    // Generar notas para cada estudiante y curso
    for (const student of students) {
      for (const course of courses) {
        for (const bimestre of bimestres) {
          for (const tipo of tiposEvaluacion) {
            const exists = existingGrades.some(
              g => g.student_id === student.id && 
                   g.course_id === course.id && 
                   g.tipo_evaluacion === tipo && 
                   g.bimestre === bimestre
            );
            
            if (!exists) {
              // Generar nota aleatoria entre 51 y 100
              const nota = Math.floor(Math.random() * (100 - 51 + 1) + 51);
              
              // Porcentaje según tipo de evaluación
              let porcentaje = 20;
              if (tipo === 'primer_parcial') porcentaje = 25;
              if (tipo === 'segundo_parcial') porcentaje = 25;
              if (tipo === 'tercer_parcial') porcentaje = 25;
              if (tipo === 'final') porcentaje = 25;
              if (tipo === 'trabajo') porcentaje = 15;
              if (tipo === 'examen') porcentaje = 30;
              
              gradesToInsert.push({
                student_id: student.id,
                course_id: course.id,
                nota: nota,
                tipo_evaluacion: tipo,
                porcentaje: porcentaje,
                fecha: new Date(),
                observacion: nota >= 70 ? 'Aprobado' : 'En proceso de recuperación',
                user_id: userId,
                bimestre: bimestre,
                created_at: new Date(),
                updated_at: new Date()
              });
            }
          }
        }
      }
    }
    
    if (gradesToInsert.length > 0) {
      // Insertar en lotes para no sobrecargar
      const batchSize = 50;
      for (let i = 0; i < gradesToInsert.length; i += batchSize) {
        const batch = gradesToInsert.slice(i, i + batchSize);
        await queryInterface.bulkInsert('grades', batch, {});
      }
      console.log(`✅ Insertadas ${gradesToInsert.length} notas/calificaciones`);
    } else {
      console.log('ℹ️ Ya existen notas para los estudiantes, no se insertaron duplicados');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('grades', null, {});
  }
};