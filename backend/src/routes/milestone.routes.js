const express = require('express');
const {
  getMilestoneById,
  updateMilestone,
  deleteMilestone
} = require('../controllers/milestone.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'));
router.use(requireTenant);

router.route('/milestones/:id')
  .get(getMilestoneById)
  .patch(updateMilestone)
  .delete(deleteMilestone);

module.exports = router;
