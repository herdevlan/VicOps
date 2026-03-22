'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen los usuarios estudiantes
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE role_id = 4`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingEmails = existingUsers.map(u => u.email);
    
    const studentsData = [
      {
        email: 'juan.perez@estudiante.edu.bo',
        nombre: 'Juan',
        apellido: 'Pérez',
        ci: '12345678',
        telefono: '76543210',
        direccion: 'Calle Principal 123'
      },
      {
        email: 'maria.garcia@estudiante.edu.bo',
        nombre: 'María',
        apellido: 'García',
        ci: '87654321',
        telefono: '76543211',
        direccion: 'Avenida Central 456'
      },
      {
        email: 'carlos.rodriguez@estudiante.edu.bo',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        ci: '11223344',
        telefono: '76543212',
        direccion: 'Calle Secundaria 789'
      }
    ];
    
    const usersToInsert = [];
    const hashedPassword = await bcrypt.hash('Estudiante2024!', 10);
    
    for (const student of studentsData) {
      if (!existingEmails.includes(student.email)) {
        usersToInsert.push({
          email: student.email,
          password: hashedPassword,
          nombre: student.nombre,
          apellido: student.apellido,
          ci: student.ci,
          telefono: student.telefono,
          direccion: student.direccion,
          estado: true,
          role_id: 4, // Estudiante
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
      console.log(`✅ Insertados ${usersToInsert.length} usuarios estudiantes`);
    } else {
      console.log('ℹ️ Los usuarios estudiantes ya existen, no se insertaron duplicados');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { role_id: 4 }, {});
  }
};