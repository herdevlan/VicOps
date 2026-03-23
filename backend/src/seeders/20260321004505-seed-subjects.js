// backend/src/seeders/20260321005001-seed-subjects.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const subjects = [
      // Ciencias Exactas
      { codigo: 'MAT-101', nombre: 'Matemáticas', area_conocimiento: 'Ciencias Exactas', horas_academicas: 144, grado: 1, estado: true },
      { codigo: 'FIS-101', nombre: 'Física', area_conocimiento: 'Ciencias Exactas', horas_academicas: 108, grado: 1, estado: true },
      { codigo: 'QUI-101', nombre: 'Química', area_conocimiento: 'Ciencias Exactas', horas_academicas: 108, grado: 1, estado: true },
      
      // Ciencias Naturales
      { codigo: 'BIO-101', nombre: 'Biología', area_conocimiento: 'Ciencias Naturales', horas_academicas: 108, grado: 1, estado: true },
      
      // Comunicación
      { codigo: 'LEN-101', nombre: 'Lengua Castellana', area_conocimiento: 'Comunicación', horas_academicas: 144, grado: 1, estado: true },
      { codigo: 'ING-101', nombre: 'Inglés', area_conocimiento: 'Comunicación', horas_academicas: 72, grado: 1, estado: true },
      { codigo: 'LOR-101', nombre: 'Lengua Originaria', area_conocimiento: 'Comunicación', horas_academicas: 72, grado: 1, estado: true },
      
      // Ciencias Sociales
      { codigo: 'SOC-101', nombre: 'Ciencias Sociales', area_conocimiento: 'Ciencias Sociales', horas_academicas: 108, grado: 1, estado: true },
      { codigo: 'HIS-101', nombre: 'Historia', area_conocimiento: 'Ciencias Sociales', horas_academicas: 108, grado: 1, estado: true },
      { codigo: 'GEO-101', nombre: 'Geografía', area_conocimiento: 'Ciencias Sociales', horas_academicas: 72, grado: 1, estado: true },
      
      // Desarrollo Productivo
      { codigo: 'EFI-101', nombre: 'Educación Física', area_conocimiento: 'Desarrollo Productivo', horas_academicas: 72, grado: 1, estado: true },
      { codigo: 'ART-101', nombre: 'Artes Plásticas', area_conocimiento: 'Desarrollo Productivo', horas_academicas: 72, grado: 1, estado: true },
      { codigo: 'MUS-101', nombre: 'Música', area_conocimiento: 'Desarrollo Productivo', horas_academicas: 72, grado: 1, estado: true },
      { codigo: 'TEC-101', nombre: 'Tecnología', area_conocimiento: 'Desarrollo Productivo', horas_academicas: 72, grado: 1, estado: true },
      
      // Valores y Espiritualidad
      { codigo: 'REL-101', nombre: 'Religión', area_conocimiento: 'Valores y Espiritualidad', horas_academicas: 72, grado: 1, estado: true },
      { codigo: 'ETI-101', nombre: 'Ética y Valores', area_conocimiento: 'Valores y Espiritualidad', horas_academicas: 72, grado: 1, estado: true },
      
      // 2do GRADO
      { codigo: 'MAT-201', nombre: 'Matemáticas', area_conocimiento: 'Ciencias Exactas', horas_academicas: 144, grado: 2, estado: true },
      { codigo: 'FIS-201', nombre: 'Física', area_conocimiento: 'Ciencias Exactas', horas_academicas: 108, grado: 2, estado: true },
      { codigo: 'QUI-201', nombre: 'Química', area_conocimiento: 'Ciencias Exactas', horas_academicas: 108, grado: 2, estado: true },
      { codigo: 'BIO-201', nombre: 'Biología', area_conocimiento: 'Ciencias Naturales', horas_academicas: 108, grado: 2, estado: true },
      { codigo: 'LEN-201', nombre: 'Lengua Castellana', area_conocimiento: 'Comunicación', horas_academicas: 144, grado: 2, estado: true },
      { codigo: 'ING-201', nombre: 'Inglés', area_conocimiento: 'Comunicación', horas_academicas: 72, grado: 2, estado: true },
      { codigo: 'SOC-201', nombre: 'Ciencias Sociales', area_conocimiento: 'Ciencias Sociales', horas_academicas: 108, grado: 2, estado: true },
      { codigo: 'HIS-201', nombre: 'Historia', area_conocimiento: 'Ciencias Sociales', horas_academicas: 108, grado: 2, estado: true }
    ];
    
    for (const subject of subjects) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM subjects WHERE codigo = '${subject.codigo}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existing.length === 0) {
        await queryInterface.bulkInsert('subjects', [{
          ...subject,
          created_at: new Date(),
          updated_at: new Date()
        }], {});
      }
    }
    console.log(`✅ Materias insertadas/verificadas`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('subjects', null, {});
  }
};