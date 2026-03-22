'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subjects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codigo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      horas_academicas: {
        type: Sequelize.INTEGER,
        defaultValue: 80
      },
      area_conocimiento: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      grado: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex('subjects', ['codigo']);
    await queryInterface.addIndex('subjects', ['nombre']);
    await queryInterface.addIndex('subjects', ['area_conocimiento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subjects');
  }
};