'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.Agency, { foreignKey: 'agencyId', as: 'agency' });
      Notification.belongsTo(models.User, { foreignKey: 'recipientUserId', as: 'recipient' });
      Notification.belongsTo(models.User, { foreignKey: 'actorUserId', as: 'actor' });
      Notification.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    }
  }

  Notification.init({
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Agencies', key: 'id' },
      onDelete: 'CASCADE'
    },
    recipientUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    actorUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    type: {
      type: DataTypes.ENUM(
        'TASK_ASSIGNED',
        'TASK_STATUS_CHANGED',
        'TASK_COMPLETED',
        'MILESTONE_UPDATED',
        'PROJECT_UPDATED',
        'MEETING_CREATED',
        'MEETING_UPDATED',
        'MEETING_CANCELLED',
        'FEEDBACK_CREATED',
        'FEEDBACK_RESPONDED',
        'FEEDBACK_STATUS_CHANGED',
        'FILE_SHARED',
        'FILE_VISIBILITY_CHANGED'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Projects', key: 'id' },
      onDelete: 'CASCADE'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'Notification'
  });

  return Notification;
};
