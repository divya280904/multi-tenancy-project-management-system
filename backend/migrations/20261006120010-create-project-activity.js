'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProjectActivities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      activityType: {
        type: Sequelize.ENUM(
          'PROJECT_CREATED',
          'PROJECT_UPDATED',
          'MILESTONE_CREATED',
          'TASK_CREATED',
          'TASK_UPDATED',
          'MEETING_CREATED',
          'MEETING_UPDATED',
          'MEETING_CANCELLED',
          'STATUS_UPDATED',
          'CLIENT_ADDED'
        ),
        allowNull: false,
        defaultValue: 'STATUS_UPDATED'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      visibility: {
        type: Sequelize.ENUM('CLIENT_VISIBLE', 'AGENCY_ONLY'),
        allowNull: false,
        defaultValue: 'CLIENT_VISIBLE'
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Agencies', key: 'id' },
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Clients', key: 'id' },
        onDelete: 'SET NULL'
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Projects', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('ProjectActivities', ['agencyId']);
    await queryInterface.addIndex('ProjectActivities', ['projectId']);
    await queryInterface.addIndex('ProjectActivities', ['clientId']);
    await queryInterface.addIndex('ProjectActivities', ['activityType']);
    await queryInterface.addIndex('ProjectActivities', ['createdAt']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProjectActivities');
  }
};
