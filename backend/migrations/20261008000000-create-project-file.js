'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProjectFiles', {
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
      uploadedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL'
      },
      originalName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      storageKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      mimeType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'application/octet-stream'
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      category: {
        type: Sequelize.ENUM('GENERAL', 'DESIGN', 'DOCUMENT', 'IMAGE', 'VIDEO', 'CONTRACT', 'DELIVERABLE', 'OTHER'),
        allowNull: false,
        defaultValue: 'GENERAL'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      visibility: {
        type: Sequelize.ENUM('INTERNAL', 'CLIENT_VISIBLE'),
        allowNull: false,
        defaultValue: 'INTERNAL'
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

    await queryInterface.addIndex('ProjectFiles', ['agencyId']);
    await queryInterface.addIndex('ProjectFiles', ['clientId']);
    await queryInterface.addIndex('ProjectFiles', ['projectId']);
    await queryInterface.addIndex('ProjectFiles', ['uploadedBy']);
    await queryInterface.addIndex('ProjectFiles', ['visibility']);
    await queryInterface.addIndex('ProjectFiles', ['category']);
    await queryInterface.addIndex('ProjectFiles', ['createdAt']);
    await queryInterface.addIndex('ProjectFiles', ['agencyId', 'projectId', 'clientId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProjectFiles');
  }
};
