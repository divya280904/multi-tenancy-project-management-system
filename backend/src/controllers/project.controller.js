const { Project, Client, User } = require('../models');
const { Op } = require('sequelize');

// @route   GET /agency/projects
const getProjects = async (req, res) => {
  try {
    const { search, status, priority, clientId, managerId, page = 1, limit = 10 } = req.query;

    let whereClause = {
      agencyId: req.user.agencyId
    };

    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (clientId) whereClause.clientId = clientId;
    if (managerId) whereClause.managerId = managerId;

    const offset = (page - 1) * limit;

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    res.status(200).json({
      success: true,
      projects: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   POST /agency/projects
const createProject = async (req, res) => {
  try {
    const { name, description, clientId, managerId, startDate, expectedCompletionDate, status, priority } = req.body;

    if (!name || !clientId || !startDate || !expectedCompletionDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate client ownership
    const client = await Client.findOne({
      where: { id: clientId, agencyId: req.user.agencyId }
    });

    if (!client) {
      return res.status(400).json({ success: false, message: 'Invalid client' });
    }

    // Validate manager ownership and role
    if (managerId) {
      const manager = await User.findOne({
        where: { id: managerId, agencyId: req.user.agencyId }
      });
      
      if (!manager || manager.role === 'CLIENT' || manager.role === 'SUPER_ADMIN') {
        return res.status(400).json({ success: false, message: 'Invalid project manager' });
      }
    }

    const project = await Project.create({
      name: name.trim(),
      description,
      clientId,
      managerId: managerId || null,
      startDate,
      expectedCompletionDate,
      status: status || 'PLANNING',
      priority: priority || 'MEDIUM',
      agencyId: req.user.agencyId
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   GET /agency/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, agencyId: req.user.agencyId },
      include: [
        { model: Client, as: 'client', attributes: ['id', 'companyName', 'email', 'phone'] },
        { model: User, as: 'manager', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   PATCH /agency/projects/:id
const updateProject = async (req, res) => {
  try {
    const { name, description, clientId, managerId, startDate, expectedCompletionDate, status, priority } = req.body;

    const project = await Project.findOne({
      where: { id: req.params.id, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Validate client ownership if changing client
    if (clientId && clientId !== project.clientId) {
      const client = await Client.findOne({
        where: { id: clientId, agencyId: req.user.agencyId }
      });
      if (!client) {
        return res.status(400).json({ success: false, message: 'Invalid client' });
      }
      project.clientId = clientId;
    }

    // Validate manager if changing manager
    if (managerId !== undefined && managerId !== project.managerId) {
      if (managerId !== null) {
        const manager = await User.findOne({
          where: { id: managerId, agencyId: req.user.agencyId }
        });
        if (!manager || manager.role === 'CLIENT' || manager.role === 'SUPER_ADMIN') {
          return res.status(400).json({ success: false, message: 'Invalid project manager' });
        }
      }
      project.managerId = managerId || null;
    }

    if (name) project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (startDate) project.startDate = startDate;
    if (expectedCompletionDate) project.expectedCompletionDate = expectedCompletionDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @route   DELETE /agency/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, agencyId: req.user.agencyId }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Hard delete is acceptable for now
    await project.destroy();

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject
};
