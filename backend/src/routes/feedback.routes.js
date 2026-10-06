const express = require('express');
const { listAgencyFeedback, getAgencyFeedbackById, updateAgencyFeedback } = require('../controllers/feedback.controller');
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
router.use(requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'));
router.use(stripProtectedFeedbackFields);
router.use(requireTenant);

router.get('/feedback', listAgencyFeedback);
router.get('/feedback/:id', getAgencyFeedbackById);
router.patch('/feedback/:id', requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), updateAgencyFeedback);

module.exports = router;
