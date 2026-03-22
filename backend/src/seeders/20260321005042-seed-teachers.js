'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen docentes
    const existingTeachers = await queryInterface.sequelize.query(
      `SELECT u.email FROM users u 
       INNER JOIN teachers t ON u.id = t.user_id`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingEmails = existingTeachers.map(t => t.email);
    
    // Primero crear usuarios docentes si no existen
    const existingUserEmails = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE role_id = 3`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingUserEmailsList = existingUserEmails.map(u => u.email);
    
    const teachersData = [
      {
        email: 'carlos.lopez@docente.edu.bo',
        nombre: 'Carlos',
        apellido: 'López',
        ci: '99887766',
        telefono: '76543213',
        especialidad: 'Matemáticas'
      },
      {
        email: 'ana.martinez@docente.edu.bo',
        nombre: 'Ana',
        apellido: 'Martínez',
        ci: '88776655',
        telefono: '76543214',
        especialidad: 'Lenguaje'
      },
      {
        email: 'luis.fernandez@docente.edu.bo',
        nombre: 'Luis',
        apellido: 'Fernández',
        ci: '77665544',
        telefono: '76543215',
        especialidad: 'Ciencias Naturales'
      }
    ];
    
    const usersToInsert = [];
    const hashedPassword = await bcrypt.hash('Docente2024!', 10);
    
    // Insertar usuarios docentes si no existen
    for (const teacher of teachersData) {
      if (!existingUserEmailsList.includes(teacher.email)) {
        usersToInsert.push({
          email: teacher.email,
          password: hashedPassword,
          nombre: teacher.nombre,
          apellido: teacher.apellido,
          ci: teacher.ci,
          telefono: teacher.telefono,
          estado: true,
          role_id: 3, // Docente
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
      console.log(`✅ Insertados ${usersToInsert.length} usuarios docentes`);
    }
    
    // Obtener IDs de usuarios docentes para crear registros en teachers
    const allTeacherUsers = await queryInterface.sequelize.query(
      `SELECT id, email, nombre, apellido, ci FROM users WHERE role_id = 3`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const teachersToInsert = [];
    
    for (const teacherUser of allTeacherUsers) {
      const teacherData = teachersData.find(t => t.email === teacherUser.email);
      if (teacherData && !existingEmails.includes(teacherUser.email)) {
        teachersToInsert.push({
          user_id: teacherUser.id,
          ci: teacherUser.ci,
          nombre: teacherUser.nombre,
          apellido: teacherUser.apellido,
          especialidad: teacherData.especialidad,
          email: teacherUser.email,
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (teachersToInsert.length > 0) {
      await queryInterface.bulkInsert('teachers', teachersToInsert, {});
      console.log(`✅ Insertados ${teachersToInsert.length} docentes en tabla teachers`);
    } else {
      console.log('ℹ️ Los docentes ya existen, no se insertaron duplicados');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('teachers', null, {});
    await queryInterface.bulkDelete('users', { role_id: 3 }, {});
  }
};