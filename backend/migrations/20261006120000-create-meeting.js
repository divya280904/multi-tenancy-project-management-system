'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Meetings', {
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
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'),
        allowNull: false,
        defaultValue: 'SCHEDULED'
      },
      meetingType: {
        type: Sequelize.ENUM('CLIENT', 'TEAM', 'INTERNAL', 'CHECKIN'),
        allowNull: false,
        defaultValue: 'CLIENT'
      },
      visibility: {
        type: Sequelize.ENUM('CLIENT_VISIBLE', 'AGENCY_ONLY'),
        allowNull: false,
        defaultValue: 'CLIENT_VISIBLE'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingLink: {
        type: Sequelize.STRING,
        allowNull: true
      },
      meetingDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: true
      },
      endTime: {
        type: Sequelize.TIME,
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Meetings', ['agencyId']);
    await queryInterface.addIndex('Meetings', ['projectId']);
    await queryInterface.addIndex('Meetings', ['clientId']);
    await queryInterface.addIndex('Meetings', ['createdBy']);
    await queryInterface.addIndex('Meetings', ['status']);
    await queryInterface.addIndex('Meetings', ['meetingDate']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Meetings');
  }
};
