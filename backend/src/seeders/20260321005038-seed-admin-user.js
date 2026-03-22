'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si el admin ya existe
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE email = 'admin@sistema.edu.bo'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingAdmin.length > 0) {
      console.log('ℹ️ El usuario administrador ya existe, no se insertó');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('Admin2024!', 10);
    
    // Insertar el usuario
    await queryInterface.bulkInsert('users', [
      {
        email: 'admin@sistema.edu.bo',
        password: hashedPassword,
        nombre: 'Administrador',
        apellido: 'del Sistema',
        ci: '10000001',
        telefono: '77777777',
        estado: true,
        role_id: 1, // Administrador
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Obtener el ID del usuario recién creado
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@sistema.edu.bo'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const userId = users[0].id;

    // Verificar si el teacher ya existe para este usuario
    const existingTeacher = await queryInterface.sequelize.query(
      `SELECT id FROM teachers WHERE user_id = :userId`,
      { replacements: { userId }, type: Sequelize.QueryTypes.SELECT }
    );
    
    if (existingTeacher.length === 0) {
      await queryInterface.bulkInsert('teachers', [
        {
          user_id: userId,
          ci: '10000001',
          nombre: 'Administrador',
          apellido: 'del Sistema',
          especialidad: 'Administración',
          email: 'admin@sistema.edu.bo',
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ], {});
      console.log('✅ Insertado teacher para administrador');
    }
    
    console.log('✅ Usuario administrador insertado correctamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@sistema.edu.bo' }, {});
  }
};