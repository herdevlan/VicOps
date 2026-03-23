// backend/src/seeders/20260321005005-seed-enrollments.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const students = await queryInterface.sequelize.query(
      `SELECT s.id as student_id, s.grado FROM students s`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const courses = await queryInterface.sequelize.query(
      `SELECT c.id as course_id, c.grado, c.paralelo FROM courses c WHERE c.estado = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const enrollmentsToInsert = [];
    
    for (const student of students) {
      // Determinar grado numérico
      const gradoEstudiante = student.grado === '1ro Secundaria' ? 1 : 2;
      // Para 1ro: ambos paralelos (A y B), para 2do: solo paralelo A
      const cursosDelGrado = courses.filter(c => {
        if (c.grado === gradoEstudiante) {
          if (gradoEstudiante === 1) {
            return c.paralelo === 'A' || c.paralelo === 'B';
          }
          return c.paralelo === 'A';
        }
        return false;
      });
      
      for (const course of cursosDelGrado) {
        const existing = await queryInterface.sequelize.query(
          `SELECT id FROM enrollments WHERE student_id = ${student.student_id} AND course_id = ${course.course_id}`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        
        if (existing.length === 0) {
          enrollmentsToInsert.push({
            student_id: student.student_id,
            course_id: course.course_id,
            estado: 'activo',
            fecha_inscripcion: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }
    
    if (enrollmentsToInsert.length > 0) {
      await queryInterface.bulkInsert('enrollments', enrollmentsToInsert, {});
      console.log(`✅ Insertadas ${enrollmentsToInsert.length} inscripciones`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('enrollments', null, {});
  }
};