// backend/src/seeders/20260321004501-seed-roles.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingRoles = await queryInterface.sequelize.query(
      `SELECT nombre FROM roles`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingNames = existingRoles.map(r => r.nombre);
    
    const rolesToInsert = [];
    
    if (!existingNames.includes('Administrador')) {
      rolesToInsert.push({
        nombre: 'Administrador',
        descripcion: 'Acceso total al sistema',
        permisos: JSON.stringify(['*']),
        nivel: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    if (!existingNames.includes('Docente')) {
      rolesToInsert.push({
        nombre: 'Docente',
        descripcion: 'Registro de notas y seguimiento académico',
        permisos: JSON.stringify(['grades:read', 'grades:write', 'reports:read', 'students:read']),
        nivel: 2,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    if (!existingNames.includes('Estudiante')) {
      rolesToInsert.push({
        nombre: 'Estudiante',
        descripcion: 'Consulta de notas y perfil propio',
        permisos: JSON.stringify(['grades:read:own', 'profile:read:own']),
        nivel: 3,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    if (rolesToInsert.length > 0) {
      await queryInterface.bulkInsert('roles', rolesToInsert, {});
      console.log(`✅ Insertados ${rolesToInsert.length} roles`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};