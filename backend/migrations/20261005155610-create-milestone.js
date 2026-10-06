'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Milestones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'PLANNED'
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Agencies', key: 'id' },
        onDelete: 'CASCADE'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Projects', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Milestones', ['agencyId']);
    await queryInterface.addIndex('Milestones', ['projectId']);
    await queryInterface.addIndex('Milestones', ['status']);
    await queryInterface.addIndex('Milestones', ['dueDate']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Milestones');
  }
};