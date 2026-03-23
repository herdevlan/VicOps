// backend/src/seeders/20260321005003-seed-students.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const studentUsers = await queryInterface.sequelize.query(
      `SELECT id, email, nombre, apellido, ci FROM users WHERE role_id = 3 ORDER BY id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // 15 estudiantes en 1ro, 15 en 2do
    for (let i = 0; i < studentUsers.length; i++) {
      const user = studentUsers[i];
      const grado = i < 15 ? '1ro Secundaria' : '2do Secundaria';
      const nivel = 'Secundaria';
      
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM students WHERE user_id = ${user.id}`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existing.length === 0) {
        await queryInterface.bulkInsert('students', [{
          user_id: user.id,
          ci: user.ci,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          matricula: `EST-2024-${String(i + 1).padStart(3, '0')}`,
          grado: grado,
          nivel: nivel,
          fecha_nacimiento: new Date(`200${Math.floor(i / 10) + 6}-${(i % 12) + 1}-15`),
          telefono: `76543${100 + i}`,
          tutor_nombre: `Tutor/a de ${user.nombre}`,
          tutor_telefono: `76543${200 + i}`,
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        }], {});
      }
    }
    console.log(`✅ Estudiantes insertados`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('students', null, {});
  }
};