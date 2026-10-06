const path = require('path');
const { ProjectFile, Project, Client, User, ProjectActivity } = require('../models');
const { Op } = require('sequelize');
const { storageService, buildStorageKey } = require('../services/storage.service');

const ALLOWED_CATEGORIES = new Set(['GENERAL', 'DESIGN', 'DOCUMENT', 'IMAGE', 'VIDEO', 'CONTRACT', 'DELIVERABLE', 'OTHER']);
const ALLOWED_VISIBILITY = new Set(['INTERNAL', 'CLIENT_VISIBLE']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/rtf'
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp', '.svg', '.txt', '.csv', '.zip', '.rtf']);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const sanitizeOriginalName = (originalName) => {
  const safeName = path.basename(originalName || 'file');
  const cleaned = safeName.replace(/[^a-zA-Z0-9._-]/g, '_').trim();
  return cleaned || 'file';
};

const isAllowedFile = (originalName, mimeType) => {
  const extension = path.extname(originalName || '').toLowerCase();
  const normalizedMime = String(mimeType || '').toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension) || ALLOWED_MIME_TYPES.has(normalizedMime);
};

const serializeFile = (file) => ({
  id: file.id,
  originalName: file.originalName,
  mimeType: file.mimeType,
  size: file.size,
  category: file.category,
  description: file.description,
  visibility: file.visibility,
  projectId: file.projectId,
  clientId: file.clientId,
  uploadedBy: file.uploadedBy,
  uploader: file.uploader ? {
    id: file.uploader.id,
    name: file.uploader.name,
    role: file.uploader.role
  } : null,
  createdAt: file.createdAt,
  updatedAt: file.updatedAt
});

const createProjectActivityEntry = async ({ agencyId, projectId, clientId, createdBy, activityType, description, visibility }) => {
  if (!agencyId || !projectId) {
    return null;
  }

  return ProjectActivity.create({
    agencyId,
    projectId,
    clientId: clientId || null,
    createdBy: createdBy || null,
    activityType,
    description,
    visibility: visibility || 'AGENCY_ONLY'
  });
};

const getClientContext = async (req) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Client, as: 'client' }]
  });

  if (!user) {
    return null;
  }

  let client = user.client;
  if (!client && user.clientId) {
    client = await Client.findOne({
      where: { id: user.clientId, agencyId: req.user.agencyId }
    });
  }

  if (!client || client.agencyId !== req.user.agencyId) {
    return null;
  }

  return { user, client };
};

const getAuthorizedProject = async (req, projectId, { allowClientVisibleOnly = false } = {}) => {
  const project = await Project.findOne({
    where: {
      id: projectId,
      agencyId: req.user.agencyId
    },
    include: [{ model: Client, as: 'client' }]
  });

  if (!project) {
    return null;
  }

  if (allowClientVisibleOnly && project.clientId !== (req.clientId || req.user.clientId)) {
    return null;
  }

  return project;
};

const getProjectFileByQuery = async ({ agencyId, projectId, fileId, clientId = null, visibility = null }) => {
  const where = {
    id: fileId,
    agencyId,
    projectId
  };

  if (clientId) {
    where.clientId = clientId;
  }

  if (visibility) {
    where.visibility = visibility;
  }

  return ProjectFile.findOne({
    where,
    include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }]
  });
};

const uploadProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId || req.body.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'A file is required for upload' });
    }

    if (file.size > MAX_FILE_SIZE) {
      return res.status(400).json({ success: false, message: 'File exceeds the 25MB upload limit' });
    }

    if (!isAllowedFile(file.originalname, file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const category = String(req.body.category || 'GENERAL').toUpperCase();
    const visibility = String(req.body.visibility || 'INTERNAL').toUpperCase();

    if (!ALLOWED_CATEGORIES.has(category)) {
      return res.status(400).json({ success: false, message: 'Invalid file category' });
    }

    if (!ALLOWED_VISIBILITY.has(visibility)) {
      return res.status(400).json({ success: false, message: 'Invalid visibility setting' });
    }

    const description = typeof req.body.description === 'string' ? req.body.description.trim().slice(0, 1000) : '';
    const originalName = sanitizeOriginalName(file.originalname);
    const storageKey = buildStorageKey(project.id, originalName);

    await storageService.upload(file.buffer, storageKey);

    const projectFile = await ProjectFile.create({
      agencyId: req.user.agencyId,
      clientId: project.clientId,
      projectId: project.id,
      uploadedBy: req.user.id,
      originalName,
      storageKey,
      mimeType: file.mimetype || 'application/octet-stream',
      size: file.size,
      category,
      description,
      visibility
    });

    await createProjectActivityEntry({
      agencyId: req.user.agencyId,
      projectId: project.id,
      clientId: project.clientId,
      createdBy: req.user.id,
      activityType: visibility === 'CLIENT_VISIBLE' ? 'FILE_SHARED_WITH_CLIENT' : 'FILE_UPLOADED',
      description: `File uploaded: ${originalName}`,
      visibility
    });

    const record = await ProjectFile.findByPk(projectFile.id, {
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }]
    });

    return res.status(201).json({ success: true, file: serializeFile(record) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const listProjectFiles = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const { category, visibility, uploader, search } = req.query;
    const where = {
      agencyId: req.user.agencyId,
      projectId: project.id,
      clientId: project.clientId
    };

    if (category) where.category = String(category).toUpperCase();
    if (visibility) where.visibility = String(visibility).toUpperCase();
    if (uploader) where.uploadedBy = Number(uploader);
    if (search) where.originalName = { [Op.like]: `%${String(search).trim()}%` };

    const files = await ProjectFile.findAll({
      where,
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      files: files.map(serializeFile)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getProjectFileById = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const file = await ProjectFile.findOne({
      where: { id: fileId, agencyId: req.user.agencyId, projectId: project.id },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    return res.status(200).json({ success: true, file: serializeFile(file) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const downloadProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const file = await ProjectFile.findOne({
      where: { id: fileId, agencyId: req.user.agencyId, projectId: project.id },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const stream = await storageService.downloadStream(file.storageKey);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    return stream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const file = await ProjectFile.findOne({
      where: { id: fileId, agencyId: req.user.agencyId, projectId: project.id }
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const nextCategory = req.body.category ? String(req.body.category).toUpperCase() : file.category;
    const nextVisibility = req.body.visibility ? String(req.body.visibility).toUpperCase() : file.visibility;

    if (!ALLOWED_CATEGORIES.has(nextCategory)) {
      return res.status(400).json({ success: false, message: 'Invalid file category' });
    }

    if (!ALLOWED_VISIBILITY.has(nextVisibility)) {
      return res.status(400).json({ success: false, message: 'Invalid visibility setting' });
    }

    if (req.body.description !== undefined) {
      file.description = String(req.body.description).trim().slice(0, 1000);
    }

    const lastVisibility = file.visibility;
    file.category = nextCategory;
    file.visibility = nextVisibility;
    await file.save();

    if (lastVisibility !== nextVisibility) {
      await createProjectActivityEntry({
        agencyId: req.user.agencyId,
        projectId: project.id,
        clientId: project.clientId,
        createdBy: req.user.id,
        activityType: nextVisibility === 'CLIENT_VISIBLE' ? 'FILE_SHARED_WITH_CLIENT' : 'FILE_VISIBILITY_CHANGED',
        description: `File visibility changed to ${nextVisibility}: ${file.originalName}`,
        visibility: nextVisibility
      });
    }

    return res.status(200).json({ success: true, file: serializeFile(file) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteProjectFile = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const fileId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(fileId) || fileId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const file = await ProjectFile.findOne({
      where: { id: fileId, agencyId: req.user.agencyId, projectId: project.id }
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    try {
      await storageService.delete(file.storageKey);
    } catch (error) {
      console.error('Storage deletion failed', error);
      return res.status(500).json({ success: false, message: 'Failed to delete uploaded file from storage' });
    }

    const fileName = file.originalName;
    await file.destroy();

    await createProjectActivityEntry({
      agencyId: req.user.agencyId,
      projectId: project.id,
      clientId: project.clientId,
      createdBy: req.user.id,
      activityType: 'FILE_DELETED',
      description: `File deleted: ${fileName}`,
      visibility: file.visibility === 'CLIENT_VISIBLE' ? 'CLIENT_VISIBLE' : 'AGENCY_ONLY'
    });

    return res.status(200).json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectFiles = async (req, res) => {
  try {
    const context = await getClientContext(req);
    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client file access' });
    }

    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      where: {
        id: projectId,
        agencyId: req.user.agencyId,
        clientId: context.client.id
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or is not visible to this client' });
    }

    const files = await ProjectFile.findAll({
      where: {
        agencyId: req.user.agencyId,
        clientId: context.client.id,
        projectId: project.id,
        visibility: 'CLIENT_VISIBLE'
      },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, files: files.map(serializeFile) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientFiles = async (req, res) => {
  try {
    const context = await getClientContext(req);
    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client file access' });
    }

    const files = await ProjectFile.findAll({
      where: {
        agencyId: req.user.agencyId,
        clientId: context.client.id,
        visibility: 'CLIENT_VISIBLE'
      },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, files: files.map(serializeFile) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const downloadClientFile = async (req, res) => {
  try {
    const context = await getClientContext(req);
    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client file access' });
    }

    const file = await ProjectFile.findOne({
      where: {
        id: Number(req.params.id),
        agencyId: req.user.agencyId,
        clientId: context.client.id,
        visibility: 'CLIENT_VISIBLE'
      },
      include: [{ model: User, as: 'uploader', attributes: ['id', 'name', 'role'] }]
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found or not available to this client' });
    }

    const stream = await storageService.downloadStream(file.storageKey);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalName)}"`);
    return stream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  uploadProjectFile,
  listProjectFiles,
  getProjectFileById,
  downloadProjectFile,
  updateProjectFile,
  deleteProjectFile,
  getClientProjectFiles,
  getClientFiles,
  downloadClientFile,
  serializeFile,
  isAllowedFile
};
