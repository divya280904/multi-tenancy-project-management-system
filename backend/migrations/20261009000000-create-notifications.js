'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Agencies', key: 'id' },
        onDelete: 'CASCADE'
      },
      recipientUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      actorUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      type: {
        type: Sequelize.ENUM(
          'TASK_ASSIGNED',
          'TASK_STATUS_CHANGED',
          'TASK_COMPLETED',
          'MILESTONE_UPDATED',
          'PROJECT_UPDATED',
          'MEETING_CREATED',
          'MEETING_UPDATED',
          'MEETING_CANCELLED',
          'FEEDBACK_CREATED',
          'FEEDBACK_RESPONDED',
          'FEEDBACK_STATUS_CHANGED',
          'FILE_SHARED',
          'FILE_VISIBILITY_CHANGED'
        ),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Projects', key: 'id' },
        onDelete: 'CASCADE'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
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

    await queryInterface.addIndex('Notifications', ['agencyId']);
    await queryInterface.addIndex('Notifications', ['recipientUserId']);
    await queryInterface.addIndex('Notifications', ['readAt']);
    await queryInterface.addIndex('Notifications', ['createdAt']);
    await queryInterface.addIndex('Notifications', ['type']);
    await queryInterface.addIndex('Notifications', ['projectId']);
    await queryInterface.addIndex('Notifications', ['recipientUserId', 'readAt', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Notifications');
  }
};
