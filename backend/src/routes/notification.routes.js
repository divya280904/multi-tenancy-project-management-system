const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllAsRead
} = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireTenant);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationAsRead);
router.patch('/read-all', markAllAsRead);

module.exports = router;
