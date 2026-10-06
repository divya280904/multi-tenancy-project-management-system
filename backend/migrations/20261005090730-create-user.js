'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      passwordHash: {
        allowNull: false,
        type: Sequelize.STRING
      },
      role: {
        allowNull: false,
        type: Sequelize.ENUM('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_TEAM', 'CLIENT'),
        defaultValue: 'CLIENT'
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('ACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
      },
      agencyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Agencies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('Users', ['email']);
    await queryInterface.addIndex('Users', ['agencyId']);
    await queryInterface.addIndex('Users', ['role']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};