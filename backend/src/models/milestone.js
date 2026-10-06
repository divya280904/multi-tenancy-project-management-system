'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Milestone extends Model {
    static associate(models) {
      Milestone.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      Milestone.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      Milestone.hasMany(models.Task, { foreignKey: 'milestoneId', as: 'tasks' });
    }
  }
  Milestone.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 120]
      }
    },
    status: {
      type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED'),
      allowNull: false,
      defaultValue: 'PLANNED'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 9999
      }
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Milestone',
  });
  return Milestone;
};