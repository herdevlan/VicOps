'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('students', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      ci: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      // ✅ NUEVOS CAMPOS ACADÉMICOS
      matricula: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Número de matrícula del estudiante'
      },
      grado: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '1ro, 2do, 3ro, 4to, 5to, 6to'
      },
      nivel: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Primaria, Secundaria, etc.'
      },
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      direccion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      tutor_nombre: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      tutor_telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      estado: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Índices existentes
    await queryInterface.addIndex('students', ['ci']);
    await queryInterface.addIndex('students', ['user_id']);
    await queryInterface.addIndex('students', ['nombre', 'apellido']);
    
    // ÍNDICES para los campos académicos
    await queryInterface.addIndex('students', ['matricula'], {
      name: 'students_matricula_idx',
      unique: true
    });
    await queryInterface.addIndex('students', ['grado'], {
      name: 'students_grado_idx'
    });
    await queryInterface.addIndex('students', ['nivel'], {
      name: 'students_nivel_idx'
    });
    await queryInterface.addIndex('students', ['grado', 'nivel'], {
      name: 'students_grado_nivel_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('students');
  }
};