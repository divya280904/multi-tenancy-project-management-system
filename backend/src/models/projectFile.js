'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProjectFile extends Model {
    static associate(models) {
      ProjectFile.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      ProjectFile.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      ProjectFile.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      ProjectFile.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
    }
  }

  ProjectFile.init({
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
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    storageKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'application/octet-stream'
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    category: {
      type: DataTypes.ENUM('GENERAL', 'DESIGN', 'DOCUMENT', 'IMAGE', 'VIDEO', 'CONTRACT', 'DELIVERABLE', 'OTHER'),
      allowNull: false,
      defaultValue: 'GENERAL'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    visibility: {
      type: DataTypes.ENUM('INTERNAL', 'CLIENT_VISIBLE'),
      allowNull: false,
      defaultValue: 'INTERNAL'
    }
  }, {
    sequelize,
    modelName: 'ProjectFile'
  });

  return ProjectFile;
};
