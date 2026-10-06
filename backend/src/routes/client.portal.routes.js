const express = require('express');
const {
  getClientDashboard,
  getClientPortalMe,
  getClientPortalProjects,
  getClientProjectById,
  getClientProjectMilestones,
  getClientProjectTasks,
  getClientPortalMeetings,
  getClientPortalMeetingById,
  getClientProjectActivity,
  getClientProjectFeedback,
  createClientProjectFeedback,
  getClientFeedbackById
} = require('../controllers/client.portal.controller');
const {
  getClientProjectFiles,
  getClientFiles,
  downloadClientFile
} = require('../controllers/file.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

const stripProtectedFeedbackFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    delete req.body.agencyId;
    delete req.body.clientId;
    delete req.body.createdBy;
    delete req.body.respondedBy;
    delete req.body.respondedAt;
    delete req.body.resolvedAt;
  }
  next();
};

router.use(requireAuth);
router.use(requireRole('CLIENT'));
router.use(stripProtectedFeedbackFields);
router.use(requireTenant);

router.get('/dashboard', getClientDashboard);
router.get('/me', getClientPortalMe);
router.get('/projects', getClientPortalProjects);
router.get('/projects/:id', getClientProjectById);
router.get('/projects/:projectId/feedback', getClientProjectFeedback);
router.post('/projects/:projectId/feedback', createClientProjectFeedback);
router.get('/projects/:projectId/files', getClientProjectFiles);
router.get('/files', getClientFiles);
router.get('/files/:id/download', downloadClientFile);
router.get('/projects/:projectId/milestones', getClientProjectMilestones);
router.get('/projects/:projectId/tasks', getClientProjectTasks);
router.get('/projects/:projectId/activity', getClientProjectActivity);
router.get('/feedback/:id', getClientFeedbackById);
router.get('/meetings', getClientPortalMeetings);
router.get('/meetings/:id', getClientPortalMeetingById);

module.exports = router;
