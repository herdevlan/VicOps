// backend/src/seeders/20260321005004-seed-courses.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const subjects = await queryInterface.sequelize.query(
      `SELECT id, codigo, grado FROM subjects`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const cursosData = [];
    
    // Para grado 1 - Paralelo A y B
    const subjectsGrado1 = subjects.filter(s => s.grado === 1);
    for (const subject of subjectsGrado1) {
      // Paralelo A
      cursosData.push({
        nombre: `${subject.codigo.split('-')[0]} 1ro A`,
        grado: 1,
        paralelo: 'A',
        gestion: 2024,
        turno: 'mañana',
        capacidad: 30,
        subject_id: subject.id,
        teacher_id: teachers[0]?.id,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      });
      // Paralelo B
      cursosData.push({
        nombre: `${subject.codigo.split('-')[0]} 1ro B`,
        grado: 1,
        paralelo: 'B',
        gestion: 2024,
        turno: 'tarde',
        capacidad: 30,
        subject_id: subject.id,
        teacher_id: teachers[1]?.id,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Para grado 2 - Paralelo A (único)
    const subjectsGrado2 = subjects.filter(s => s.grado === 2);
    for (const subject of subjectsGrado2) {
      cursosData.push({
        nombre: `${subject.codigo.split('-')[0]} 2do A`,
        grado: 2,
        paralelo: 'A',
        gestion: 2024,
        turno: 'mañana',
        capacidad: 30,
        subject_id: subject.id,
        teacher_id: teachers[2]?.id,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    for (const curso of cursosData) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM courses WHERE grado = ${curso.grado} AND paralelo = '${curso.paralelo}' AND gestion = ${curso.gestion} AND subject_id = ${curso.subject_id}`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (existing.length === 0) {
        await queryInterface.bulkInsert('courses', [curso], {});
      }
    }
    console.log(`✅ Insertados ${cursosData.length} cursos`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('courses', null, {});
  }
};