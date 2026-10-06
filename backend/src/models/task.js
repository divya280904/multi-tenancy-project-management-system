'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    static associate(models) {
      Task.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      Task.belongsTo(models.Milestone, { foreignKey: 'milestoneId', as: 'milestone', allowNull: true });
      Task.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee', allowNull: true });
      Task.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
    }
  }
  Task.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'COMPLETED'),
      allowNull: false,
      defaultValue: 'TODO'
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    milestoneId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    assigneeId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};