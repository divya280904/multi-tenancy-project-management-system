'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      User.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' });
      User.hasMany(models.Project, { foreignKey: 'managerId', as: 'managedProjects' });
      User.hasMany(models.Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
      User.hasMany(models.Meeting, { foreignKey: 'createdBy', as: 'createdMeetings' });
      User.hasMany(models.ProjectActivity, { foreignKey: 'createdBy', as: 'projectActivities' });
      User.hasMany(models.ProjectFeedback, { foreignKey: 'createdBy', as: 'createdFeedback' });
      User.hasMany(models.ProjectFeedback, { foreignKey: 'respondedBy', as: 'responses' });
      User.hasMany(models.ProjectFile, { foreignKey: 'uploadedBy', as: 'uploadedFiles' });
      User.hasMany(models.Notification, { foreignKey: 'recipientUserId', as: 'receivedNotifications' });
      User.hasMany(models.Notification, { foreignKey: 'actorUserId', as: 'createdNotifications' });
    }

    async validatePassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    }
  }
  User.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_TEAM', 'CLIENT'),
      allowNull: false,
      defaultValue: 'CLIENT'
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
      allowNull: false,
      defaultValue: 'ACTIVE'
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};