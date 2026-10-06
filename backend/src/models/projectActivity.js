'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectActivity extends Model {
    static associate(models) {
      ProjectActivity.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      ProjectActivity.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      ProjectActivity.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      ProjectActivity.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
  }

  ProjectActivity.init({
    activityType: {
      type: DataTypes.ENUM(
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'MILESTONE_CREATED',
        'TASK_CREATED',
        'TASK_UPDATED',
        'MEETING_CREATED',
        'MEETING_UPDATED',
        'MEETING_CANCELLED',
        'STATUS_UPDATED',
        'CLIENT_ADDED',
        'FEEDBACK_CREATED',
        'CHANGE_REQUEST_CREATED',
        'FEEDBACK_STATUS_CHANGED',
        'FEEDBACK_RESPONDED',
        'FEEDBACK_RESOLVED',
        'FEEDBACK_REJECTED'
      ),
      allowNull: false,
      defaultValue: 'STATUS_UPDATED'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    visibility: {
      type: DataTypes.ENUM('CLIENT_VISIBLE', 'AGENCY_ONLY'),
      allowNull: false,
      defaultValue: 'CLIENT_VISIBLE'
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Agencies',
        key: 'id'
      }
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Clients',
        key: 'id'
      }
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'ProjectActivity'
  });

  return ProjectActivity;
};
