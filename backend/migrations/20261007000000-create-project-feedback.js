'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProjectFeedbacks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('FEEDBACK', 'CHANGE_REQUEST', 'BUG', 'QUESTION'),
        allowNull: false,
        defaultValue: 'FEEDBACK'
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
        allowNull: false,
        defaultValue: 'MEDIUM'
      },
      status: {
        type: Sequelize.ENUM('OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'OPEN'
      },
      agencyResponse: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Agencies', key: 'id' },
        onDelete: 'CASCADE'
      },
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Clients', key: 'id' },
        onDelete: 'CASCADE'
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
      respondedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      respondedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resolvedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('ProjectFeedbacks', ['agencyId']);
    await queryInterface.addIndex('ProjectFeedbacks', ['clientId']);
    await queryInterface.addIndex('ProjectFeedbacks', ['projectId']);
    await queryInterface.addIndex('ProjectFeedbacks', ['status']);
    await queryInterface.addIndex('ProjectFeedbacks', ['createdBy']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ProjectFeedbacks');
  }
};
