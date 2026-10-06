'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meeting extends Model {
    static associate(models) {
      Meeting.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      Meeting.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      Meeting.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      Meeting.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
  }

  Meeting.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'),
      allowNull: false,
      defaultValue: 'SCHEDULED'
    },
    meetingType: {
      type: DataTypes.ENUM('CLIENT', 'TEAM', 'INTERNAL', 'CHECKIN'),
      allowNull: false,
      defaultValue: 'CLIENT'
    },
    visibility: {
      type: DataTypes.ENUM('CLIENT_VISIBLE', 'AGENCY_ONLY'),
      allowNull: false,
      defaultValue: 'CLIENT_VISIBLE'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true
    },
    meetingDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    endTime: {
      type: DataTypes.TIME,
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
    }
  }, {
    sequelize,
    modelName: 'Meeting'
  });

  return Meeting;
};
