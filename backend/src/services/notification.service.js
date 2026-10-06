const models = require('../models');
const { Op } = require('sequelize');
const Notification = models.Notification;
const User = models.User;

class NotificationService {
  static async createNotification({
    agencyId,
    recipientUserId,
    actorUserId = null,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    projectId = null,
    metadata = null
  }) {
    if (!agencyId || !recipientUserId || !type || !title || !message) {
      return null;
    }

    if (!Notification || typeof Notification.create !== 'function') {
      return null;
    }

    return Notification.create({
      agencyId,
      recipientUserId,
      actorUserId,
      type,
      title,
      message,
      entityType,
      entityId,
      projectId,
      metadata
    });
  }

  static async createNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return [];
    }

    const validNotifications = notifications.filter(Boolean).filter((notification) => {
      return notification.agencyId && notification.recipientUserId && notification.type && notification.title && notification.message;
    });

    if (validNotifications.length === 0) {
      return [];
    }

    if (!Notification || typeof Notification.bulkCreate !== 'function') {
      return validNotifications;
    }

    return Notification.bulkCreate(validNotifications);
  }

  static async getNotifications({ agencyId, recipientUserId, unreadOnly = false, type = null, projectId = null, page = 1, limit = 20 }) {
    const where = { agencyId, recipientUserId };

    if (unreadOnly) {
      where.readAt = null;
    }

    if (type) {
      where.type = type;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const offset = (Number(page) - 1) * Number(limit);

    if (!Notification || typeof Notification.findAndCountAll !== 'function') {
      return { count: 0, rows: [] };
    }

    return Notification.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'name', 'email', 'role']
      }]
    });
  }

  static async getUnreadCount({ agencyId, recipientUserId }) {
    if (!Notification || typeof Notification.count !== 'function') {
      return 0;
    }

    return Notification.count({
      where: {
        agencyId,
        recipientUserId,
        readAt: null
      }
    });
  }

  static async markAsRead({ id, agencyId, recipientUserId }) {
    if (!Notification || typeof Notification.findOne !== 'function') {
      return null;
    }

    const notification = await Notification.findOne({
      where: { id, agencyId, recipientUserId }
    });

    if (!notification) {
      return null;
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  static async markAllAsRead({ agencyId, recipientUserId }) {
    if (!Notification || typeof Notification.update !== 'function') {
      return [0];
    }

    return Notification.update(
      { readAt: new Date() },
      {
        where: {
          agencyId,
          recipientUserId,
          readAt: null
        }
      }
    );
  }

  static async findAgencyUsers(agencyId, roles = ['AGENCY_ADMIN', 'AGENCY_TEAM'], excludeIds = []) {
    const where = { agencyId, role: { [Op.in]: roles } };
    if (excludeIds.length) {
      where.id = { [Op.notIn]: excludeIds };
    }

    if (!User || typeof User.findAll !== 'function') {
      return [];
    }

    return User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'agencyId']
    });
  }

  static async findClientUsers(agencyId, clientId, excludeIds = []) {
    const where = { agencyId, clientId, role: 'CLIENT' };
    if (excludeIds.length) {
      where.id = { [Op.notIn]: excludeIds };
    }

    if (!User || typeof User.findAll !== 'function') {
      return [];
    }

    return User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'agencyId', 'clientId']
    });
  }
}

module.exports = NotificationService;
