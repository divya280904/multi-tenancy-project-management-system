'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Agencies', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Agencies', 'status');
  }
};
