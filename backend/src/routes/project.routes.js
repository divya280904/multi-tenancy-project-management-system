const express = require('express');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/project.controller');
const {
  getMilestonesForProject,
  createMilestoneForProject
} = require('../controllers/milestone.controller');
const {
  getProjectTasks,
  createProjectTask
} = require('../controllers/task.controller');
const {
  getProjectMeetings,
  createMeeting,
  getProjectActivity
} = require('../controllers/meeting.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('AGENCY_ADMIN'));
router.use(requireTenant);

router.route('/')
  .get(getProjects)
  .post(requireRole('AGENCY_ADMIN'), createProject);

router.route('/:id')
  .get(getProjectById)
  .patch(requireRole('AGENCY_ADMIN'), updateProject)
  .delete(requireRole('AGENCY_ADMIN'), deleteProject);

router.route('/:projectId/milestones')
  .get(getMilestonesForProject)
  .post(requireRole('AGENCY_ADMIN'), createMilestoneForProject);

router.route('/:projectId/tasks')
  .get(getProjectTasks)
  .post(requireRole('AGENCY_ADMIN'), createProjectTask);

router.route('/:projectId/meetings')
  .get(getProjectMeetings)
  .post(requireRole('AGENCY_ADMIN'), createMeeting);

router.route('/:projectId/activity')
  .get(getProjectActivity);

module.exports = router;
