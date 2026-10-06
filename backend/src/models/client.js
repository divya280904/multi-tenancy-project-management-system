'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Client.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      Client.hasMany(models.Project, { foreignKey: 'clientId' });
      Client.hasMany(models.User, { foreignKey: 'clientId', as: 'users' });
      Client.hasMany(models.Meeting, { foreignKey: 'clientId' });
      Client.hasMany(models.ProjectFeedback, { foreignKey: 'clientId' });
      Client.hasMany(models.ProjectFile, { foreignKey: 'clientId' });
    }
  }
  Client.init({
    companyName: DataTypes.STRING,
    primaryContact: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    notes: DataTypes.TEXT,
    status: DataTypes.STRING,
    agencyId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Client',
  });
  return Client;
};