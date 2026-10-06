const express = require('express');
const {
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  createMeeting,
  getProjectMeetings
} = require('../controllers/meeting.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.route('/meetings')
  .all(requireAuth, requireRole('AGENCY_ADMIN'), requireTenant)
  .get(getProjectMeetings)
  .post(createMeeting);

router.route('/meetings/:id')
  .all(requireAuth, requireRole('AGENCY_ADMIN'), requireTenant)
  .get(getMeetingById)
  .patch(updateMeeting)
  .delete(cancelMeeting);

module.exports = router;
