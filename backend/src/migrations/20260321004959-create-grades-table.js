'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('grades', {
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
      nota: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      tipo_evaluacion: {
        type: Sequelize.ENUM('primer_parcial', 'segundo_parcial', 'tercer_parcial', 'final', 'trabajo', 'examen', 'recuperatorio'),
        allowNull: false
      },
      porcentaje: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      fecha: {
        type: Sequelize.DATEONLY,
        defaultValue: Sequelize.literal('CURRENT_DATE'),
        allowNull: false
      },
      observacion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      evaluacion_numero: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Número de evaluación (1, 2, 3, 4, 5, 6, etc.)'
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

    await queryInterface.addIndex('grades', ['student_id']);
    await queryInterface.addIndex('grades', ['course_id']);
    await queryInterface.addIndex('grades', ['user_id']);
    await queryInterface.addIndex('grades', ['tipo_evaluacion']);
    await queryInterface.addIndex('grades', ['evaluacion_numero']);
    await queryInterface.addIndex('grades', ['fecha']);
    await queryInterface.addIndex('grades', ['student_id', 'course_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('grades');
  }
};