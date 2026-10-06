const express = require('express');
const {
  getAgencyAiProjectSummary,
  getClientAiProjectSummary,
  getAgencyAiProjectInsights,
  getClientAiProjectInsights,
  askAgencyProjectQuestion,
  askClientProjectQuestion,
  getAgencyMeetingAiSummary,
  getClientMeetingAiSummary,
  createAgencyMeetingActionTasks,
} = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/agency/projects/:id/ai-summary', requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), requireTenant, getAgencyAiProjectSummary);
router.get('/agency/projects/:id/ai-insights', requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), requireTenant, getAgencyAiProjectInsights);
router.post('/agency/projects/:id/ai-ask', requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), requireTenant, askAgencyProjectQuestion);
router.get('/agency/projects/:projectId/meetings/:meetingId/ai-summary', requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), requireTenant, getAgencyMeetingAiSummary);
router.post('/agency/projects/:projectId/meetings/:meetingId/ai-action-items', requireRole('AGENCY_ADMIN'), requireTenant, createAgencyMeetingActionTasks);

router.get('/client-portal/projects/:id/ai-summary', requireRole('CLIENT'), requireTenant, getClientAiProjectSummary);
router.get('/client-portal/projects/:id/ai-insights', requireRole('CLIENT'), requireTenant, getClientAiProjectInsights);
router.post('/client-portal/projects/:id/ai-ask', requireRole('CLIENT'), requireTenant, askClientProjectQuestion);
router.get('/client-portal/projects/:projectId/meetings/:meetingId/ai-summary', requireRole('CLIENT'), requireTenant, getClientMeetingAiSummary);

module.exports = router;
