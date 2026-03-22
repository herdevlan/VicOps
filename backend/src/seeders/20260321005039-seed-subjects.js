'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('subjects', [
      {
        codigo: 'MAT-101',
        nombre: 'Matemáticas',
        descripcion: 'Matemáticas básicas y avanzadas',
        horas_academicas: 80,
        area_conocimiento: 'Ciencias Exactas',
        grado: 1,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'LEN-101',
        nombre: 'Lenguaje',
        descripcion: 'Comunicación y lenguaje',
        horas_academicas: 80,
        area_conocimiento: 'Lenguaje',
        grado: 1,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'CIE-101',
        nombre: 'Ciencias Naturales',
        descripcion: 'Biología, Física, Química básica',
        horas_academicas: 80,
        area_conocimiento: 'Ciencias Naturales',
        grado: 1,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'SOC-101',
        nombre: 'Ciencias Sociales',
        descripcion: 'Historia, Geografía, Formación Ciudadana',
        horas_academicas: 80,
        area_conocimiento: 'Ciencias Sociales',
        grado: 1,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        codigo: 'ING-101',
        nombre: 'Inglés',
        descripcion: 'Idioma inglés básico e intermedio',
        horas_academicas: 80,
        area_conocimiento: 'Lenguas Extranjeras',
        grado: 1,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
    console.log('✅ Materias insertadas correctamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subjects', null, {});
  }
};