const { Task, Project, Milestone, User } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../services/notification.service');
const { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } = require('../utils/taskStatus');

const taskStatusSet = new Set(TASK_STATUS_OPTIONS);
const taskPrioritySet = new Set(TASK_PRIORITY_OPTIONS);

const validateTaskPayload = (body) => {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : null;

  if (body.title !== undefined && !title) {
    return { error: 'Task title is required' };
  }

  if (body.status !== undefined && body.status !== null && !taskStatusSet.has(body.status)) {
    return { error: 'Invalid task status' };
  }

  if (body.priority !== undefined && body.priority !== null && !taskPrioritySet.has(body.priority)) {
    return { error: 'Invalid task priority' };
  }

  if (body.dueDate !== undefined && body.dueDate !== null && body.dueDate !== '' && Number.isNaN(new Date(body.dueDate).getTime())) {
    return { error: 'Invalid due date' };
  }

  if (body.milestoneId !== undefined && body.milestoneId !== null && body.milestoneId !== '') {
    const parsed = Number(body.milestoneId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { error: 'Milestone ID must be a valid positive integer' };
    }
  }

  if (body.assigneeId !== undefined && body.assigneeId !== null && body.assigneeId !== '') {
    const parsed = Number(body.assigneeId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { error: 'Assignee ID must be a valid positive integer' };
    }
  }

  return {
    title,
    description,
    status: body.status || 'TODO',
    priority: body.priority || 'MEDIUM',
    dueDate: body.dueDate || null,
    milestoneId: body.milestoneId !== undefined ? body.milestoneId : undefined,
    assigneeId: body.assigneeId !== undefined ? body.assigneeId : undefined,
    descriptionValue: description
  };
};

const getProjectTasks = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const { status, priority, assigneeId, milestoneId, search, page = 1, limit = 20 } = req.query;

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const where = { projectId: project.id, agencyId: req.user.agencyId };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (milestoneId) where.milestoneId = milestoneId;
    if (search) where.title = { [Op.like]: `%${String(search).trim()}%` };

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Task.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['dueDate', 'ASC'], ['createdAt', 'DESC']],
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: Milestone, as: 'milestone', attributes: ['id', 'name', 'status'] }
      ]
    });

    return res.status(200).json({
      success: true,
      tasks: rows,
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

const createProjectTask = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const { title, description, milestoneId, assigneeId, status, priority, dueDate } = req.body;

    if (req.user.role !== 'AGENCY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only agency admins can create tasks' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const validated = validateTaskPayload({ title, description, milestoneId, assigneeId, status, priority, dueDate });
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    if (milestoneId !== undefined && milestoneId !== null && milestoneId !== '') {
      const milestone = await Milestone.findOne({
        where: { id: milestoneId, agencyId: req.user.agencyId, projectId: project.id }
      });

      if (!milestone) {
        return res.status(400).json({ success: false, message: 'Milestone does not belong to this project and agency' });
      }
    }

    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== '') {
      const assignee = await User.findOne({
        where: {
          id: assigneeId,
          agencyId: req.user.agencyId,
          role: { [Op.in]: ['AGENCY_ADMIN', 'AGENCY_TEAM'] }
        },
        attributes: ['id', 'agencyId', 'role']
      });

      if (!assignee || !['AGENCY_ADMIN', 'AGENCY_TEAM'].includes(assignee.role)) {
        return res.status(400).json({ success: false, message: 'Assignee must be a valid agency team member' });
      }
    }

    const task = await Task.create({
      title: validated.title,
      description: validated.descriptionValue,
      projectId: project.id,
      agencyId: req.user.agencyId,
      milestoneId: (validated.milestoneId === undefined || validated.milestoneId === null || validated.milestoneId === '') ? null : Number(validated.milestoneId),
      assigneeId: (validated.assigneeId === undefined || validated.assigneeId === null || validated.assigneeId === '') ? null : Number(validated.assigneeId),
      status: validated.status,
      priority: validated.priority,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null
    });

    if (task.assigneeId) {
      const projectSummary = await Project.findByPk(project.id, { attributes: ['id', 'name'] });
      const assignee = await User.findByPk(task.assigneeId, { attributes: ['id', 'name', 'role', 'agencyId'] });

      if (assignee && assignee.agencyId === req.user.agencyId) {
        await NotificationService.createNotification({
          agencyId: req.user.agencyId,
          recipientUserId: assignee.id,
          actorUserId: req.user.id,
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `You were assigned "${task.title}" in ${projectSummary ? projectSummary.name : 'this project'}.`,
          entityType: 'TASK',
          entityId: task.id,
          projectId: project.id,
          metadata: { taskId: task.id, title: task.title }
        });
      }
    }

    return res.status(201).json({ success: true, task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getTaskById = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      where: { id: taskId, agencyId: req.user.agencyId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'role'] },
        { model: Milestone, as: 'milestone', attributes: ['id', 'name', 'status'] }
      ]
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or not in your agency' });
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      where: { id: taskId, agencyId: req.user.agencyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or not in your agency' });
    }

    const isAdmin = req.user.role === 'AGENCY_ADMIN';
    const isAssignedUser = req.user.role === 'AGENCY_TEAM' && task.assigneeId === req.user.id;

    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you' });
    }

    const allowedFields = ['title', 'description', 'milestoneId', 'assigneeId', 'status', 'priority', 'dueDate'];
    const payload = {};
    const previousStatus = task.status;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    }

    if (!isAdmin && Object.prototype.hasOwnProperty.call(payload, 'assigneeId')) {
      return res.status(403).json({ success: false, message: 'Only agency admins can reassign tasks' });
    }

    if (payload.title !== undefined) {
      const title = String(payload.title).trim();
      if (!title) {
        return res.status(400).json({ success: false, message: 'Task title is required' });
      }
      task.title = title;
    }

    if (payload.description !== undefined) {
      task.description = payload.description === null || payload.description === '' ? null : String(payload.description).trim();
    }

    if (payload.milestoneId !== undefined) {
      if (payload.milestoneId === null || payload.milestoneId === '') {
        task.milestoneId = null;
      } else {
        const milestone = await Milestone.findOne({
          where: { id: payload.milestoneId, agencyId: req.user.agencyId, projectId: task.projectId }
        });
        if (!milestone) {
          return res.status(400).json({ success: false, message: 'Milestone must belong to the same agency and project' });
        }
        task.milestoneId = Number(payload.milestoneId);
      }
    }

    if (payload.assigneeId !== undefined && payload.assigneeId !== null && payload.assigneeId !== '') {
      const assignee = await User.findOne({
        where: {
          id: payload.assigneeId,
          agencyId: req.user.agencyId,
          role: { [Op.in]: ['AGENCY_ADMIN', 'AGENCY_TEAM'] }
        },
        attributes: ['id', 'agencyId', 'role']
      });

      if (!assignee) {
        return res.status(400).json({ success: false, message: 'Assignee must be a valid agency user' });
      }
      task.assigneeId = Number(payload.assigneeId);
    }

    if (payload.status !== undefined) {
      if (!taskStatusSet.has(payload.status)) {
        return res.status(400).json({ success: false, message: 'Invalid task status' });
      }
      task.status = payload.status;
    }

    if (payload.priority !== undefined) {
      if (!taskPrioritySet.has(payload.priority)) {
        return res.status(400).json({ success: false, message: 'Invalid task priority' });
      }
      task.priority = payload.priority;
    }

    if (payload.dueDate !== undefined) {
      if (payload.dueDate === null || payload.dueDate === '') {
        task.dueDate = null;
      } else if (Number.isNaN(new Date(payload.dueDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid due date' });
      } else {
        task.dueDate = new Date(payload.dueDate);
      }
    }

    await task.save();

    if (payload.status !== undefined && payload.status !== previousStatus) {
      const project = await Project.findByPk(task.projectId, { attributes: ['id', 'name', 'managerId'] });
      const recipients = await NotificationService.findAgencyUsers(req.user.agencyId, ['AGENCY_ADMIN', 'AGENCY_TEAM'], [req.user.id, task.assigneeId || null].filter(Boolean));

      const notifications = recipients
        .filter((user) => user.id !== req.user.id)
        .map((user) => ({
          agencyId: req.user.agencyId,
          recipientUserId: user.id,
          actorUserId: req.user.id,
          type: 'TASK_STATUS_CHANGED',
          title: 'Task status updated',
          message: `Task "${task.title}" changed to ${task.status}.`,
          entityType: 'TASK',
          entityId: task.id,
          projectId: task.projectId,
          metadata: { taskId: task.id, status: task.status }
        }));

      if (project && project.managerId && project.managerId !== req.user.id) {
        notifications.push({
          agencyId: req.user.agencyId,
          recipientUserId: project.managerId,
          actorUserId: req.user.id,
          type: 'TASK_STATUS_CHANGED',
          title: 'Task status updated',
          message: `Task "${task.title}" changed to ${task.status}.`,
          entityType: 'TASK',
          entityId: task.id,
          projectId: task.projectId,
          metadata: { taskId: task.id, status: task.status }
        });
      }

      if (notifications.length) {
        await NotificationService.createNotifications(notifications);
      }
    }

    if (payload.assigneeId !== undefined && payload.assigneeId !== null && payload.assigneeId !== '' && Number(payload.assigneeId) !== task.assigneeId) {
      const assignee = await User.findByPk(Number(payload.assigneeId), { attributes: ['id', 'agencyId'] });
      if (assignee && assignee.agencyId === req.user.agencyId) {
        await NotificationService.createNotification({
          agencyId: req.user.agencyId,
          recipientUserId: assignee.id,
          actorUserId: req.user.id,
          type: 'TASK_ASSIGNED',
          title: 'New task assigned',
          message: `You were assigned "${task.title}".`,
          entityType: 'TASK',
          entityId: task.id,
          projectId: task.projectId,
          metadata: { taskId: task.id }
        });
      }
    }

    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    const task = await Task.findOne({
      where: { id: taskId, agencyId: req.user.agencyId }
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or not in your agency' });
    }

    if (req.user.role !== 'AGENCY_ADMIN' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this task' });
    }

    await task.destroy();

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getProjectTasks,
  createProjectTask,
  getTaskById,
  updateTask,
  deleteTask,
};
