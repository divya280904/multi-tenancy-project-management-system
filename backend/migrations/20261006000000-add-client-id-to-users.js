'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'clientId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('Users', ['clientId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', ['clientId']);
    await queryInterface.removeColumn('Users', 'clientId');
  }
};
