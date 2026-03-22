// backend/src/seeders/20260321005041-seed-students.js (versión actualizada)
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingStudents = await queryInterface.sequelize.query(
      `SELECT user_id FROM students`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const existingUserIds = existingStudents.map(s => s.user_id);
    
    const studentUsers = await queryInterface.sequelize.query(
      `SELECT id, email, nombre, apellido, ci FROM users WHERE role_id = 4`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (studentUsers.length === 0) {
      console.log('⚠️ No hay usuarios con rol estudiante');
      return;
    }
    
    const studentsToInsert = [];
    
    // Datos de estudiantes con los nuevos campos
    const estudiantesData = [
      { nombre: 'Juan', apellido: 'Pérez', grado: '1ro Secundaria', nivel: 'Secundaria', matricula: 'EST-2024-001' },
      { nombre: 'María', apellido: 'García', grado: '1ro Secundaria', nivel: 'Secundaria', matricula: 'EST-2024-002' },
      { nombre: 'Carlos', apellido: 'Rodríguez', grado: '1ro Secundaria', nivel: 'Secundaria', matricula: 'EST-2024-003' }
    ];
    
    for (let i = 0; i < studentUsers.length; i++) {
      const user = studentUsers[i];
      const data = estudiantesData[i];
      
      if (!existingUserIds.includes(user.id)) {
        studentsToInsert.push({
          user_id: user.id,
          ci: user.ci,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          matricula: data.matricula,
          grado: data.grado,
          nivel: data.nivel,
          fecha_nacimiento: new Date('2005-06-15'),
          direccion: 'Dirección de prueba',
          telefono: '76543210',
          tutor_nombre: `Tutor de ${user.nombre}`,
          tutor_telefono: '76543210',
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (studentsToInsert.length > 0) {
      await queryInterface.bulkInsert('students', studentsToInsert, {});
      console.log(`✅ Insertados ${studentsToInsert.length} estudiantes con matrícula, grado y nivel`);
    } else {
      console.log('ℹ️ Los estudiantes ya existen');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('students', null, {});
  }
};