const express = require('express');
const multer = require('multer');
const {
  uploadProjectFile,
  listProjectFiles,
  getProjectFileById,
  downloadProjectFile,
  updateProjectFile,
  deleteProjectFile
} = require('../controllers/file.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { requireTenant } = require('../middleware/tenant.middleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const { isAllowedFile } = require('../controllers/file.controller');
    if (!isAllowedFile(file.originalname, file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  }
});

const stripProtectedFileFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    delete req.body.agencyId;
    delete req.body.clientId;
    delete req.body.projectId;
    delete req.body.uploadedBy;
    delete req.body.storageKey;
  }
  next();
};

router.use('/:projectId/files', requireAuth, requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), stripProtectedFileFields, requireTenant);
router.use('/:projectId/files/:id', requireAuth, requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), stripProtectedFileFields, requireTenant);
router.use('/:projectId/files/:id/download', requireAuth, requireRole('AGENCY_ADMIN', 'AGENCY_TEAM'), requireTenant);

router.route('/:projectId/files')
  .get(listProjectFiles)
  .post(upload.single('file'), uploadProjectFile);

router.route('/:projectId/files/:id')
  .get(getProjectFileById)
  .patch(updateProjectFile)
  .delete(deleteProjectFile);

router.route('/:projectId/files/:id/download')
  .get(downloadProjectFile);

module.exports = router;
