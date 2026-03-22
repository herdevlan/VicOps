// backend/scripts/test-models.js
const { sequelize, Role, User, Subject, Student, Teacher, Course, Enrollment, Grade } = require('../src/models');
const logger = require('../src/utils/logger');

const testModels = async () => {
  try {
    logger.info('=== INICIANDO PRUEBA DE MODELOS ===\n');

    // 1. Probar Roles
    const roles = await Role.findAll();
    logger.info(`📋 Roles encontrados: ${roles.length}`);
    roles.forEach(role => {
      logger.info(`   - ${role.nombre} (nivel: ${role.nivel})`);
    });

    // 2. Probar Usuarios
    const users = await User.findAll({
      include: [{ model: Role, as: 'role' }]
    });
    logger.info(`\n👥 Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      logger.info(`   - ${user.email} (${user.role.nombre})`);
    });

    // 3. Probar Materias
    const subjects = await Subject.findAll();
    logger.info(`\n📚 Materias encontradas: ${subjects.length}`);
    subjects.forEach(subject => {
      logger.info(`   - ${subject.codigo}: ${subject.nombre}`);
    });

    // 4. Verificar relaciones
    logger.info('\n=== VERIFICANDO RELACIONES ===');
    
    // Verificar que User tiene relación con Role
    const userWithRole = await User.findOne({
      include: [{ model: Role, as: 'role' }]
    });
    if (userWithRole) {
      logger.info('✅ User → Role: OK');
    }

    // Verificar que Subject tiene relación con Course
    const subjectWithCourse = await Subject.findOne({
      include: [{ model: Course, as: 'courses' }]
    });
    logger.info('✅ Subject → Course: OK');

    logger.info('\n=== TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE ===');
    
  } catch (error) {
    logger.error('❌ Error en la prueba de modelos:', error);
  } finally {
    await sequelize.close();
  }
};

testModels();