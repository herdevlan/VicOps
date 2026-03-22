'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar cursos existentes
    const existingCourses = await queryInterface.sequelize.query(
      `SELECT nombre, grado, paralelo, gestion, subject_id FROM courses`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Verificar que existen materias (subjects)
    const subjects = await queryInterface.sequelize.query(
      `SELECT id, codigo, nombre FROM subjects`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (subjects.length === 0) {
      console.log('⚠️ No hay materias registradas, primero ejecuta el seeder de subjects');
      return;
    }
    
    // Verificar que existen docentes (teachers)
    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM teachers`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    const coursesToInsert = [];
    
    // Datos de cursos según la estructura real de la tabla
    const coursesData = [
      // 1ro A - Mañana
      { nombre: 'Matemáticas 1ro A', nivel: 'Secundaria', grado: 1, paralelo: 'A', gestion: 2024, turno: 'mañana', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'MAT-101')?.id || subjects[0]?.id },
      { nombre: 'Lenguaje 1ro A', nivel: 'Secundaria', grado: 1, paralelo: 'A', gestion: 2024, turno: 'mañana', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'LEN-101')?.id || subjects[1]?.id },
      { nombre: 'Ciencias Naturales 1ro A', nivel: 'Secundaria', grado: 1, paralelo: 'A', gestion: 2024, turno: 'mañana', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'CIE-101')?.id || subjects[2]?.id },
      { nombre: 'Ciencias Sociales 1ro A', nivel: 'Secundaria', grado: 1, paralelo: 'A', gestion: 2024, turno: 'mañana', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'SOC-101')?.id || subjects[3]?.id },
      
      // 1ro B - Tarde
      { nombre: 'Matemáticas 1ro B', nivel: 'Secundaria', grado: 1, paralelo: 'B', gestion: 2024, turno: 'tarde', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'MAT-101')?.id || subjects[0]?.id },
      { nombre: 'Lenguaje 1ro B', nivel: 'Secundaria', grado: 1, paralelo: 'B', gestion: 2024, turno: 'tarde', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'LEN-101')?.id || subjects[1]?.id },
      { nombre: 'Ciencias Naturales 1ro B', nivel: 'Secundaria', grado: 1, paralelo: 'B', gestion: 2024, turno: 'tarde', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'CIE-101')?.id || subjects[2]?.id },
      { nombre: 'Ciencias Sociales 1ro B', nivel: 'Secundaria', grado: 1, paralelo: 'B', gestion: 2024, turno: 'tarde', capacidad: 30, subject_id: subjects.find(s => s.codigo === 'SOC-101')?.id || subjects[3]?.id }
    ];
    
    // Verificar que no existan cursos duplicados
    for (const course of coursesData) {
      const exists = existingCourses.some(
        ec => ec.grado === course.grado && 
              ec.paralelo === course.paralelo && 
              ec.gestion === course.gestion && 
              ec.subject_id === course.subject_id
      );
      
      if (!exists && course.subject_id) {
        // Asignar teacher_id aleatorio si hay docentes
        if (teachers.length > 0) {
          course.teacher_id = teachers[Math.floor(Math.random() * teachers.length)].id;
        }
        
        coursesToInsert.push({
          ...course,
          estado: true,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    if (coursesToInsert.length > 0) {
      await queryInterface.bulkInsert('courses', coursesToInsert, {});
      console.log(`✅ Insertados ${coursesToInsert.length} cursos`);
    } else {
      console.log('ℹ️ Los cursos ya existen, no se insertaron duplicados');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('courses', null, {});
  }
};