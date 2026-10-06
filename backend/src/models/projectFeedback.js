'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectFeedback extends Model {
    static associate(models) {
      ProjectFeedback.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      ProjectFeedback.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      ProjectFeedback.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      ProjectFeedback.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      ProjectFeedback.belongsTo(models.User, { foreignKey: 'respondedBy', as: 'responder' });
    }
  }

  ProjectFeedback.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('FEEDBACK', 'CHANGE_REQUEST', 'BUG', 'QUESTION'),
      allowNull: false,
      defaultValue: 'FEEDBACK'
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    status: {
      type: DataTypes.ENUM('OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'),
      allowNull: false,
      defaultValue: 'OPEN'
    },
    agencyResponse: {
      type: DataTypes.TEXT,
      allowNull: true
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
      allowNull: false,
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
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    respondedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ProjectFeedback'
  });

  return ProjectFeedback;
};
