'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      nivel: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      grado: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      paralelo: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      gestion: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      turno: {
        type: Sequelize.ENUM('mañana', 'tarde', 'noche'),
        defaultValue: 'mañana'
      },
      capacidad: {
        type: Sequelize.INTEGER,
        defaultValue: 30
      },
      teacher_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'teachers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'subjects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    await queryInterface.addIndex('courses', ['teacher_id']);
    await queryInterface.addIndex('courses', ['subject_id']);
    await queryInterface.addIndex('courses', ['gestion']);
    await queryInterface.addIndex('courses', ['turno']);
    await queryInterface.addIndex('courses', ['grado', 'paralelo', 'gestion', 'subject_id'], {
      unique: true,
      name: 'unique_course_per_year'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courses');
  }
};