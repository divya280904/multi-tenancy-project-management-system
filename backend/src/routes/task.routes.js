const express = require('express');
const {
  getTaskById,
  updateTask,
  deleteTask
} = require('../controllers/task.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'));
router.use(requireTenant);

router.route('/tasks/:id')
  .get(getTaskById)
  .patch(updateTask)
  .delete(deleteTask);

module.exports = router;
