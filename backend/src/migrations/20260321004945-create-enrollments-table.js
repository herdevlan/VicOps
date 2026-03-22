'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('enrollments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      course_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fecha_inscripcion: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('activo', 'retirado', 'aprobado', 'reprobado', 'trasladado'),
        defaultValue: 'activo'
      },
      nota_final: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_retiro: {
        type: Sequelize.DATEONLY,
        allowNull: true
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
      }
    });

    await queryInterface.addIndex('enrollments', ['student_id']);
    await queryInterface.addIndex('enrollments', ['course_id']);
    await queryInterface.addIndex('enrollments', ['estado']);
    await queryInterface.addIndex('enrollments', ['student_id', 'course_id'], {
      unique: true,
      name: 'unique_student_course'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('enrollments');
  }
};