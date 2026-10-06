const express = require('express');
const {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient
} = require('../controllers/client.controller');

const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();

router.use(requireAuth);
// Agency Admin only for client management functionality
router.use(requireRole('AGENCY_ADMIN'));
router.use(requireTenant);

router.route('/')
  .get(getClients)
  .post(createClient);

router.route('/:id')
  .get(getClientById)
  .patch(updateClient)
  .delete(deleteClient);

module.exports = router;
