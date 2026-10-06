const { Milestone, Project, Task } = require('../models');
const { Op } = require('sequelize');
const { MILESTONE_STATUS_OPTIONS } = require('../utils/taskStatus');

const allowedMilestoneStatuses = new Set(MILESTONE_STATUS_OPTIONS);

const getMilestonesForProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const { status, search, limit = 50, page = 1 } = req.query;

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const where = { projectId: project.id, agencyId: req.user.agencyId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = { [Op.like]: `%${search.trim()}%` };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Milestone.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      include: [{ model: Task, as: 'tasks', attributes: ['id'] }]
    });

    const milestones = rows.map((milestone) => ({
      ...milestone.toJSON(),
      taskCount: milestone.tasks ? milestone.tasks.length : 0
    }));

    return res.status(200).json({
      success: true,
      milestones,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createMilestoneForProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const { name, status, dueDate, order } = req.body;

    if (!req.user || !req.user.agencyId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role !== 'AGENCY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only agency admins can create milestones' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const trimmedName = typeof name === 'string' ? name.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ success: false, message: 'Milestone name is required' });
    }

    const normalizedStatus = status || 'PLANNED';
    if (!allowedMilestoneStatuses.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid milestone status' });
    }

    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid due date' });
    }

    const normalizedOrder = Number(order ?? 0);
    if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0 || normalizedOrder > 9999) {
      return res.status(400).json({ success: false, message: 'Order must be a non-negative integer' });
    }

    const milestone = await Milestone.create({
      name: trimmedName,
      status: normalizedStatus,
      dueDate: dueDate || null,
      order: normalizedOrder,
      projectId: project.id,
      agencyId: req.user.agencyId
    });

    return res.status(201).json({ success: true, milestone });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMilestoneById = async (req, res) => {
  try {
    const milestoneId = Number(req.params.id);
    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
    }

    const milestone = await Milestone.findOne({
      where: { id: milestoneId, agencyId: req.user.agencyId },
      include: [{ model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'assigneeId'] }]
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found or not in your agency' });
    }

    return res.status(200).json({ success: true, milestone });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateMilestone = async (req, res) => {
  try {
    const milestoneId = Number(req.params.id);
    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
    }

    const milestone = await Milestone.findOne({
      where: { id: milestoneId, agencyId: req.user.agencyId }
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found or not in your agency' });
    }

    if (req.user.role !== 'AGENCY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only agency admins can update milestones' });
    }

    const { name, status, dueDate, order, projectId } = req.body;

    if (projectId !== undefined && Number(projectId) !== milestone.projectId) {
      const project = await Project.findOne({
        where: { id: projectId, agencyId: req.user.agencyId }
      });
      if (!project) {
        return res.status(400).json({ success: false, message: 'Project must belong to the same agency' });
      }
      milestone.projectId = Number(projectId);
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Milestone name is required' });
      }
      milestone.name = trimmedName;
    }

    if (status !== undefined) {
      if (!allowedMilestoneStatuses.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid milestone status' });
      }
      milestone.status = status;
    }

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        milestone.dueDate = null;
      } else if (Number.isNaN(new Date(dueDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid due date' });
      } else {
        milestone.dueDate = new Date(dueDate);
      }
    }

    if (order !== undefined) {
      const normalizedOrder = Number(order);
      if (!Number.isInteger(normalizedOrder) || normalizedOrder < 0 || normalizedOrder > 9999) {
        return res.status(400).json({ success: false, message: 'Order must be a non-negative integer' });
      }
      milestone.order = normalizedOrder;
    }

    await milestone.save();

    return res.status(200).json({ success: true, milestone });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const milestoneId = Number(req.params.id);
    if (!Number.isInteger(milestoneId) || milestoneId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid milestone ID' });
    }

    const milestone = await Milestone.findOne({
      where: { id: milestoneId, agencyId: req.user.agencyId }
    });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found or not in your agency' });
    }

    if (req.user.role !== 'AGENCY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only agency admins can delete milestones' });
    }

    const taskCount = await Task.count({
      where: { milestoneId: milestone.id, agencyId: req.user.agencyId }
    });

    if (taskCount > 0) {
      await Task.update(
        { milestoneId: null },
        { where: { milestoneId: milestone.id, agencyId: req.user.agencyId } }
      );
    }

    await milestone.destroy();

    return res.status(200).json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getMilestonesForProject,
  createMilestoneForProject,
  getMilestoneById,
  updateMilestone,
  deleteMilestone,
};
