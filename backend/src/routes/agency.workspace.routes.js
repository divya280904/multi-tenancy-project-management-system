const express = require('express');
const {
  getAgencyDashboard,
  getAgencyProfile,
  updateAgencyProfile,
  getTeamMembers,
  getTeamMemberById,
  addTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  removeTeamMember
} = require('../controllers/agency.workspace.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'));
router.use(requireTenant);

router.get('/dashboard', getAgencyDashboard);
router.get('/profile', getAgencyProfile);
router.put('/profile', requireRole('AGENCY_ADMIN'), updateAgencyProfile);

router.get('/team', getTeamMembers);
router.post('/team', requireRole('AGENCY_ADMIN'), addTeamMember);
router.get('/team/:id', requireRole('AGENCY_ADMIN'), getTeamMemberById);
router.patch('/team/:id', requireRole('AGENCY_ADMIN'), updateTeamMember);
router.patch('/team/:id/status', requireRole('AGENCY_ADMIN'), updateTeamMemberStatus);
router.delete('/team/:id', requireRole('AGENCY_ADMIN'), removeTeamMember);

module.exports = router;
