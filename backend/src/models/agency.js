'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Agency extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Agency.hasMany(models.User, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Client, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Project, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Milestone, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Task, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Meeting, { foreignKey: 'agencyId' });
      Agency.hasMany(models.ProjectActivity, { foreignKey: 'agencyId' });
      Agency.hasMany(models.ProjectFeedback, { foreignKey: 'agencyId' });
      Agency.hasMany(models.ProjectFile, { foreignKey: 'agencyId' });
      Agency.hasMany(models.Notification, { foreignKey: 'agencyId' });
    }
  }
  Agency.init({
    name: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    }
  }, {
    sequelize,
    modelName: 'Agency',
  });
  return Agency;
};