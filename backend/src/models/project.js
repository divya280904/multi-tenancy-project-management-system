'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Project.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      Project.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      Project.belongsTo(models.User, { foreignKey: 'managerId', as: 'manager' });
      Project.hasMany(models.Milestone, { foreignKey: 'projectId', as: 'milestones' });
      Project.hasMany(models.Task, { foreignKey: 'projectId', as: 'tasks' });
      Project.hasMany(models.Meeting, { foreignKey: 'projectId', as: 'meetings' });
      Project.hasMany(models.ProjectActivity, { foreignKey: 'projectId', as: 'activities' });
      Project.hasMany(models.ProjectFeedback, { foreignKey: 'projectId', as: 'feedback' });
      Project.hasMany(models.ProjectFile, { foreignKey: 'projectId', as: 'files' });
      Project.hasMany(models.Notification, { foreignKey: 'projectId', as: 'notifications' });
    }
  }
  Project.init({
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    startDate: DataTypes.DATE,
    expectedCompletionDate: DataTypes.DATE,
    status: DataTypes.STRING,
    priority: DataTypes.STRING,
    agencyId: DataTypes.INTEGER,
    clientId: DataTypes.INTEGER,
    managerId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};