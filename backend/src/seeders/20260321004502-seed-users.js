// backend/src/seeders/20260321005000-seed-users.js
'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedStudentPassword = await bcrypt.hash('Estudiante2026!', 10);
    const hashedAdminPassword = await bcrypt.hash('Admin2026!', 10);
    const hashedTeacherPassword = await bcrypt.hash('Docente2026!', 10);
    
    const usersToInsert = [];
    
    // Admin
    const existingAdmin = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE email = 'admin@sistema.edu.bo'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (existingAdmin.length === 0) {
      usersToInsert.push({
        email: 'admin@sistema.edu.bo',
        password: hashedAdminPassword,
        nombre: 'Administrador',
        apellido: 'del Sistema',
        ci: '10000001',
        telefono: '77777777',
        estado: true,
        role_id: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Docentes (8 - uno por área principal)
    const existingTeachers = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE role_id = 2`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingTeacherEmails = existingTeachers.map(t => t.email);
    
    const teachers = [
      { email: 'jose.mamani@docente.edu.bo', nombre: 'José', apellido: 'Mamani', ci: '99887711', telefono: '76543201', especialidad: 'Matemáticas' },
      { email: 'lucia.flores@docente.edu.bo', nombre: 'Lucía', apellido: 'Flores', ci: '99887722', telefono: '76543202', especialidad: 'Lengua Castellana' },
      { email: 'carlos.quispe@docente.edu.bo', nombre: 'Carlos', apellido: 'Quispe', ci: '99887733', telefono: '76543203', especialidad: 'Ciencias Naturales' },
      { email: 'ana.choque@docente.edu.bo', nombre: 'Ana', apellido: 'Choque', ci: '99887744', telefono: '76543204', especialidad: 'Ciencias Sociales' },
      { email: 'roberto.mendez@docente.edu.bo', nombre: 'Roberto', apellido: 'Méndez', ci: '99887755', telefono: '76543205', especialidad: 'Inglés' },
      { email: 'patricia.torrez@docente.edu.bo', nombre: 'Patricia', apellido: 'Torrez', ci: '99887766', telefono: '76543206', especialidad: 'Educación Física' },
      { email: 'fernando.gutierrez@docente.edu.bo', nombre: 'Fernando', apellido: 'Gutiérrez', ci: '99887777', telefono: '76543207', especialidad: 'Arte y Música' },
      { email: 'elena.vargas@docente.edu.bo', nombre: 'Elena', apellido: 'Vargas', ci: '99887788', telefono: '76543208', especialidad: 'Religión y Ética' }
    ];
    
    for (const teacher of teachers) {
      if (!existingTeacherEmails.includes(teacher.email)) {
        usersToInsert.push({
          email: teacher.email,
          password: hashedTeacherPassword,
          nombre: teacher.nombre,
          apellido: teacher.apellido,
          ci: teacher.ci,
          telefono: teacher.telefono,
          estado: true,
          role_id: 2,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    // Estudiantes (30)
    const existingStudents = await queryInterface.sequelize.query(
      `SELECT email FROM users WHERE role_id = 3`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingStudentEmails = existingStudents.map(s => s.email);
    
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía', 'Diego', 'Valentina', 'Andrés', 'Camila', 'Javier', 'Isabella', 'Mateo', 'Lucía', 'Sebastián', 'Daniela', 'Felipe', 'Renata', 'Gabriel', 'Emilia', 'Nicolás', 'Antonella', 'Martín', 'Paula', 'Ricardo', 'Fernanda', 'Alejandro', 'Valeria'];
    const apellidos = ['Pérez', 'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Fernández', 'Díaz', 'Sánchez', 'Romero', 'Flores', 'Morales', 'Ortiz', 'Ramírez', 'Torres', 'Vargas', 'Rojas', 'Castillo', 'Silva', 'Castro', 'Mendoza', 'Herrera', 'Navarro', 'Muñoz', 'Paredes', 'Aguilar', 'Ríos', 'Molina', 'Cruz', 'Ochoa'];
    
    for (let i = 0; i < 30; i++) {
      const email = `${nombres[i].toLowerCase()}.${apellidos[i].toLowerCase()}@estudiante.edu.bo`;
      if (!existingStudentEmails.includes(email)) {
        usersToInsert.push({
          email: email,
          password: hashedStudentPassword,
          nombre: nombres[i],
          apellido: apellidos[i],
          ci: `${9000000 + i}`,
          telefono: `76543${100 + i}`,
          estado: true,
          role_id: 3,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
      console.log(`✅ Insertados ${usersToInsert.length} usuarios`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};