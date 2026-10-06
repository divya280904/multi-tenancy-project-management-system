'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up (queryInterface, Sequelize) {
    const demoEmails = [
      'superadmin@appzex.com',
      'admin@demoagency.com',
      'team@demoagency.com',
      'client@company.com',
      'admin@northstaragency.com',
      'team1@northstaragency.com',
      'team2@northstaragency.com',
      'admin@brightlaneagency.com',
      'team1@brightlaneagency.com',
      'team2@brightlaneagency.com',
      'client@northstar.com',
      'client@brightlane.com'
    ];

    await queryInterface.bulkDelete('Users', { email: { [Sequelize.Op.in]: demoEmails } }, {});
    await queryInterface.bulkDelete('Agencies', { name: { [Sequelize.Op.in]: ['Demo Agency', 'Northstar Agency', 'Brightlane Agency'] } }, {});

    await queryInterface.bulkInsert('Agencies', [
      { name: 'Demo Agency', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Northstar Agency', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Brightlane Agency', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() }
    ], {});

    const agencyRows = await queryInterface.sequelize.query(
      "SELECT id, name FROM Agencies WHERE name IN (:agencyNames)",
      {
        replacements: { agencyNames: ['Demo Agency', 'Northstar Agency', 'Brightlane Agency'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const agencyMap = Object.fromEntries(agencyRows.map((agency) => [agency.name, agency.id]));
    const passwordHash = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('Clients', [
      { companyName: 'Northstar Client Company', primaryContact: 'Northstar Contact', email: 'hello@northstarclient.com', phone: '555-0101', status: 'ACTIVE', agencyId: agencyMap['Northstar Agency'], createdAt: new Date(), updatedAt: new Date() },
      { companyName: 'Brightlane Client Company', primaryContact: 'Brightlane Contact', email: 'hello@brightlaneclient.com', phone: '555-0102', status: 'ACTIVE', agencyId: agencyMap['Brightlane Agency'], createdAt: new Date(), updatedAt: new Date() },
      { companyName: 'Demo Client Company', primaryContact: 'Demo Contact', email: 'hello@democlient.com', phone: '555-0103', status: 'ACTIVE', agencyId: agencyMap['Demo Agency'], createdAt: new Date(), updatedAt: new Date() }
    ], {});

    const clientRows = await queryInterface.sequelize.query(
      "SELECT id, companyName FROM Clients WHERE companyName IN (:companyNames)",
      {
        replacements: { companyNames: ['Northstar Client Company', 'Brightlane Client Company', 'Demo Client Company'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const clientMap = Object.fromEntries(clientRows.map((client) => [client.companyName, client.id]));

    await queryInterface.bulkInsert('Users', [
      { name: 'Super Admin', email: 'superadmin@appzex.com', passwordHash, role: 'SUPER_ADMIN', status: 'ACTIVE', agencyId: null, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Demo Agency Admin', email: 'admin@demoagency.com', passwordHash, role: 'AGENCY_ADMIN', status: 'ACTIVE', agencyId: agencyMap['Demo Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Demo Team Lead', email: 'team@demoagency.com', passwordHash, role: 'AGENCY_TEAM', status: 'ACTIVE', agencyId: agencyMap['Demo Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Northstar Agency Admin', email: 'admin@northstaragency.com', passwordHash, role: 'AGENCY_ADMIN', status: 'ACTIVE', agencyId: agencyMap['Northstar Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Northstar Designer', email: 'team1@northstaragency.com', passwordHash, role: 'AGENCY_TEAM', status: 'ACTIVE', agencyId: agencyMap['Northstar Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Northstar PM', email: 'team2@northstaragency.com', passwordHash, role: 'AGENCY_TEAM', status: 'ACTIVE', agencyId: agencyMap['Northstar Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Brightlane Agency Admin', email: 'admin@brightlaneagency.com', passwordHash, role: 'AGENCY_ADMIN', status: 'ACTIVE', agencyId: agencyMap['Brightlane Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Brightlane Strategist', email: 'team1@brightlaneagency.com', passwordHash, role: 'AGENCY_TEAM', status: 'ACTIVE', agencyId: agencyMap['Brightlane Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Brightlane Project Lead', email: 'team2@brightlaneagency.com', passwordHash, role: 'AGENCY_TEAM', status: 'ACTIVE', agencyId: agencyMap['Brightlane Agency'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Northstar Client', email: 'client@northstar.com', passwordHash, role: 'CLIENT', status: 'ACTIVE', agencyId: agencyMap['Northstar Agency'], clientId: clientMap['Northstar Client Company'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Brightlane Client', email: 'client@brightlane.com', passwordHash, role: 'CLIENT', status: 'ACTIVE', agencyId: agencyMap['Brightlane Agency'], clientId: clientMap['Brightlane Client Company'], createdAt: new Date(), updatedAt: new Date() },
      { name: 'Demo Client User', email: 'client@company.com', passwordHash, role: 'CLIENT', status: 'ACTIVE', agencyId: agencyMap['Demo Agency'], clientId: clientMap['Demo Client Company'], createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Agencies', null, {});
  }
};
