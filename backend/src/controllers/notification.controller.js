const NotificationService = require('../services/notification.service');

const serializeNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  entityType: notification.entityType,
  entityId: notification.entityId,
  projectId: notification.projectId,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  actor: notification.actor ? {
    id: notification.actor.id,
    name: notification.actor.name,
    email: notification.actor.email,
    role: notification.actor.role
  } : null
});

const getNotifications = async (req, res) => {
  try {
    const { unreadOnly, type, projectId, page = 1, limit = 20 } = req.query;

    const result = await NotificationService.getNotifications({
      agencyId: req.user.agencyId,
      recipientUserId: req.user.id,
      unreadOnly: unreadOnly === 'true' || unreadOnly === true,
      type: type || null,
      projectId: projectId ? Number(projectId) : null,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      notifications: result.rows.map(serializeNotification),
      pagination: {
        total: result.count,
        page: Number(page),
        pages: Math.ceil(result.count / Number(limit)) || 1
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount({
      agencyId: req.user.agencyId,
      recipientUserId: req.user.id
    });

    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const notification = await NotificationService.markAsRead({
      id,
      agencyId: req.user.agencyId,
      recipientUserId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, notification: serializeNotification(notification) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsRead({
      agencyId: req.user.agencyId,
      recipientUserId: req.user.id
    });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead,
  serializeNotification
};
