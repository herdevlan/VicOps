// backend/src/seeders/20260321005002-seed-teachers.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const teacherUsers = await queryInterface.sequelize.query(
      `SELECT id, email, nombre, apellido, ci FROM users WHERE role_id = 2 ORDER BY id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const especialidades = [
      'Matemáticas', 'Lengua Castellana', 'Ciencias Naturales', 
      'Ciencias Sociales', 'Inglés', 'Educación Física', 
      'Arte y Música', 'Religión y Ética'
    ];
    
    for (let i = 0; i < teacherUsers.length; i++) {
      const user = teacherUsers[i];
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM teachers WHERE user_id = ${user.id}`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existing.length === 0) {
        await queryInterface.bulkInsert('teachers', [{
          user_id: user.id,
          ci: user.ci,
          nombre: user.nombre,
          apellido: user.apellido,
          especialidad: especialidades[i % especialidades.length],
          email: user.email,
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        }], {});
      }
    }
    console.log(`✅ Docentes insertados`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('teachers', null, {});
  }
};