const express = require('express');
const {
  getAdminDashboard,
  createAgency,
  getAgencies,
  getAgencyById,
  updateAgency,
  suspendAgency,
  activateAgency,
  impersonateAgency
} = require('../controllers/admin.agency.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

// Apply auth and rbac middleware to all routes in this file
router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.post('/', createAgency);
router.get('/', getAgencies);
router.get('/:id', getAgencyById);
router.put('/:id', updateAgency);
router.patch('/:id/suspend', suspendAgency);
router.patch('/:id/activate', activateAgency);
router.post('/:id/impersonate', impersonateAgency);

module.exports = router;
