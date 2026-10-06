const { Project, Client, User, Milestone, Task, Meeting, ProjectActivity, ProjectFeedback } = require('../models');
const { Op } = require('sequelize');
const DashboardService = require('../services/dashboard.service');

const serializeProject = (project) => ({
  id: project.id,
  name: project.name,
  description: project.description,
  status: project.status,
  priority: project.priority,
  startDate: project.startDate,
  expectedCompletionDate: project.expectedCompletionDate,
  clientId: project.clientId,
  manager: project.manager ? { name: project.manager.name } : null,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt
});

const serializeMilestone = (milestone) => ({
  id: milestone.id,
  name: milestone.name,
  status: milestone.status,
  dueDate: milestone.dueDate,
  order: milestone.order
});

const serializeTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  milestoneId: task.milestoneId,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  assignee: task.assignee ? { name: task.assignee.name } : null
});

const serializeMeeting = (meeting) => ({
  id: meeting.id,
  title: meeting.title,
  description: meeting.description,
  status: meeting.status,
  meetingType: meeting.meetingType,
  visibility: meeting.visibility,
  location: meeting.location,
  meetingLink: meeting.meetingLink,
  meetingDate: meeting.meetingDate,
  startTime: meeting.startTime,
  endTime: meeting.endTime,
  projectId: meeting.projectId,
  clientId: meeting.clientId,
  createdBy: meeting.createdBy,
  createdAt: meeting.createdAt,
  updatedAt: meeting.updatedAt
});

const serializeActivity = (activity) => ({
  id: activity.id,
  activityType: activity.activityType,
  description: activity.description,
  visibility: activity.visibility,
  projectId: activity.projectId,
  clientId: activity.clientId,
  createdBy: activity.createdBy,
  createdAt: activity.createdAt
});

const serializeFeedback = (feedback) => ({
  id: feedback.id,
  title: feedback.title,
  description: feedback.description,
  type: feedback.type,
  priority: feedback.priority,
  status: feedback.status,
  agencyResponse: feedback.agencyResponse || null,
  agencyId: feedback.agencyId,
  clientId: feedback.clientId,
  projectId: feedback.projectId,
  createdBy: feedback.createdBy,
  respondedBy: feedback.respondedBy || null,
  respondedAt: feedback.respondedAt || null,
  resolvedAt: feedback.resolvedAt || null,
  createdAt: feedback.createdAt,
  updatedAt: feedback.updatedAt,
  project: feedback.project ? {
    id: feedback.project.id,
    name: feedback.project.name
  } : null,
  client: feedback.client ? {
    id: feedback.client.id,
    companyName: feedback.client.companyName
  } : null,
  creator: feedback.creator ? {
    id: feedback.creator.id,
    name: feedback.creator.name,
    email: feedback.creator.email,
    role: feedback.creator.role
  } : null,
  responder: feedback.responder ? {
    id: feedback.responder.id,
    name: feedback.responder.name,
    email: feedback.responder.email,
    role: feedback.responder.role
  } : null
});

const resolveClientContext = async (req) => {
  if (!req.user || req.user.role !== 'CLIENT') {
    return null;
  }

  let user = await User.findByPk(req.user.id, {
    include: [{ model: Client, as: 'client' }]
  });

  if (!user) {
    return null;
  }

  let client = user.client || null;
  if (!client && user.clientId) {
    client = await Client.findOne({
      where: { id: user.clientId, agencyId: req.user.agencyId }
    });
  }

  if (!client) {
    return null;
  }

  if (user.agencyId !== req.user.agencyId || client.agencyId !== req.user.agencyId) {
    return null;
  }

  return { user: { ...user.toJSON ? user.toJSON() : user, clientId: client.id }, client };
};

const getAuthorizedClientProject = async (req, clientId) => {
  return Project.findOne({
    where: {
      id: req.params.id || req.params.projectId,
      clientId,
      agencyId: req.user.agencyId
    },
    include: [
      { model: User, as: 'manager', attributes: ['id', 'name'] },
      {
        model: Milestone,
        as: 'milestones',
        attributes: ['id', 'name', 'status', 'dueDate', 'order'],
        order: [['order', 'ASC']]
      },
      {
        model: Task,
        as: 'tasks',
        attributes: ['id', 'title', 'description', 'milestoneId', 'status', 'priority', 'dueDate'],
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
        order: [['dueDate', 'ASC']]
      }
    ]
  });
};

const getClientDashboard = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const dashboard = await DashboardService.getClientDashboard({
      agencyId: req.user.agencyId,
      clientId: context.client.id,
      userId: req.user.id,
      from: req.query.from,
      to: req.query.to,
    });

    return res.status(200).json(dashboard);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientPortalMe = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const { user, client } = context;

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      client: {
        id: client.id,
        companyName: client.companyName,
        primaryContact: client.primaryContact,
        email: client.email,
        phone: client.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientPortalProjects = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const { client } = context;
    const { search, status, priority } = req.query;

    const where = {
      agencyId: req.user.agencyId,
      clientId: client.id
    };

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'manager', attributes: ['id', 'name'] }]
    });

    res.status(200).json({
      success: true,
      projects: rows.map(serializeProject),
      pagination: {
        total: count,
        page: 1,
        pages: Math.ceil(count / (rows.length || 1)) || 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectById = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const project = await getAuthorizedClientProject(req, context.client.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const projectData = {
      ...serializeProject(project),
      milestones: (project.milestones || []).map(serializeMilestone),
      tasks: (project.tasks || []).map(serializeTask)
    };

    res.status(200).json({ success: true, project: projectData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectMilestones = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const project = await getAuthorizedClientProject(req, context.client.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const milestones = await Milestone.findAll({
      where: {
        projectId: project.id,
        agencyId: req.user.agencyId
      },
      attributes: ['id', 'name', 'status', 'dueDate', 'order'],
      order: [['order', 'ASC']]
    });

    res.status(200).json({ success: true, milestones: milestones.map(serializeMilestone) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectTasks = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const project = await getAuthorizedClientProject(req, context.client.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const tasks = await Task.findAll({
      where: {
        projectId: project.id,
        agencyId: req.user.agencyId
      },
      attributes: ['id', 'title', 'description', 'milestoneId', 'status', 'priority', 'dueDate'],
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
      order: [['dueDate', 'ASC']]
    });

    res.status(200).json({ success: true, tasks: tasks.map(serializeTask) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientPortalMeetings = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const { client } = context;
    const { status, projectId } = req.query;

    const where = {
      agencyId: req.user.agencyId,
      clientId: client.id,
      visibility: 'CLIENT_VISIBLE'
    };

    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const meetings = await Meeting.findAll({
      where,
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['meetingDate', 'ASC'], ['startTime', 'ASC']]
    });

    res.status(200).json({ success: true, meetings: meetings.map(serializeMeeting) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientPortalMeetingById = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const meeting = await Meeting.findOne({
      where: {
        id: req.params.id,
        agencyId: req.user.agencyId,
        clientId: context.client.id,
        visibility: 'CLIENT_VISIBLE'
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    res.status(200).json({ success: true, meeting: serializeMeeting(meeting) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectActivity = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const project = await getAuthorizedClientProject(req, context.client.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const activity = await ProjectActivity.findAll({
      where: {
        projectId: project.id,
        agencyId: req.user.agencyId,
        visibility: 'CLIENT_VISIBLE'
      },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }]
    });

    res.status(200).json({ success: true, activities: activity.map(serializeActivity) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientProjectFeedback = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const projectId = Number(req.params.projectId || req.params.id);
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
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const feedback = await ProjectFeedback.findAll({
      where: {
        projectId: project.id,
        agencyId: req.user.agencyId,
        clientId: context.client.id
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'responder', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ success: true, feedback: feedback.map(serializeFeedback) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createClientProjectFeedback = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const projectId = Number(req.params.projectId || req.params.id);
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
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { title, description, type, priority } = req.body;
    const normalizedTitle = typeof title === 'string' ? title.trim() : '';
    const normalizedDescription = typeof description === 'string' ? description.trim() : '';
    const normalizedType = typeof type === 'string' ? type.toUpperCase() : 'FEEDBACK';
    const normalizedPriority = typeof priority === 'string' ? priority.toUpperCase() : 'MEDIUM';

    if (!normalizedTitle) {
      return res.status(400).json({ success: false, message: 'Feedback title is required' });
    }

    if (!normalizedDescription) {
      return res.status(400).json({ success: false, message: 'Feedback description is required' });
    }

    if (!['FEEDBACK', 'CHANGE_REQUEST', 'BUG', 'QUESTION'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback type' });
    }

    if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(normalizedPriority)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback priority' });
    }

    const feedback = await ProjectFeedback.create({
      agencyId: req.user.agencyId,
      clientId: context.client.id,
      projectId: project.id,
      createdBy: req.user.id,
      title: normalizedTitle,
      description: normalizedDescription,
      type: normalizedType,
      priority: normalizedPriority,
      status: 'OPEN'
    });

    await ProjectActivity.create({
      agencyId: req.user.agencyId,
      projectId: project.id,
      clientId: context.client.id,
      createdBy: req.user.id,
      activityType: normalizedType === 'CHANGE_REQUEST' ? 'CHANGE_REQUEST_CREATED' : 'FEEDBACK_CREATED',
      description: `Feedback submitted: ${normalizedTitle}`,
      visibility: 'CLIENT_VISIBLE'
    });

    return res.status(201).json({ success: true, feedback: serializeFeedback(feedback) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getClientFeedbackById = async (req, res) => {
  try {
    const context = await resolveClientContext(req);

    if (!context) {
      return res.status(403).json({ success: false, message: 'Not authorized for client portal access' });
    }

    const feedbackId = Number(req.params.id);
    const feedback = await ProjectFeedback.findOne({
      where: {
        id: feedbackId,
        agencyId: req.user.agencyId,
        clientId: context.client.id
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'responder', attributes: ['id', 'name', 'email', 'role'] }
      ]
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    return res.status(200).json({ success: true, feedback: serializeFeedback(feedback) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getClientDashboard,
  getClientPortalMe,
  getClientPortalProjects,
  getClientProjectById,
  getClientProjectMilestones,
  getClientProjectTasks,
  getClientPortalMeetings,
  getClientPortalMeetingById,
  getClientProjectActivity,
  getClientProjectFeedback,
  createClientProjectFeedback,
  getClientFeedbackById
};
