const { Project, Meeting, Task, User } = require('../models');
const { projectAiService } = require('../services/ai.service');

const getProjectForAi = async (req, userContext) => {
  const projectId = Number(req.params.id || req.params.projectId);
  if (!projectId) {
    return null;
  }

  const where = { id: projectId, agencyId: req.user.agencyId };
  if (req.user.role === 'CLIENT') {
    where.clientId = userContext.client.id;
  }

  const project = await Project.findOne({
    where,
    include: [
      { model: require('../models').User, as: 'manager', attributes: ['id', 'name'] },
      { model: require('../models').Milestone, as: 'milestones', attributes: ['id', 'name', 'status', 'dueDate', 'order'], order: [['order', 'ASC']] },
      { model: require('../models').Task, as: 'tasks', attributes: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'milestoneId'], include: [{ model: require('../models').User, as: 'assignee', attributes: ['id', 'name'] }], order: [['dueDate', 'ASC']] },
      { model: require('../models').Meeting, as: 'meetings', attributes: ['id', 'title', 'status', 'meetingDate', 'startTime', 'endTime', 'visibility', 'meetingType', 'location'], order: [['meetingDate', 'ASC']] },
      { model: require('../models').ProjectFeedback, as: 'feedback', attributes: ['id', 'title', 'description', 'type', 'priority', 'status', 'createdAt'], order: [['createdAt', 'DESC']] },
      { model: require('../models').ProjectActivity, as: 'activities', attributes: ['id', 'activityType', 'description', 'visibility', 'createdAt'], order: [['createdAt', 'DESC']] }
    ]
  });

  if (!project) {
    return null;
  }

  if (Number(project.agencyId) !== Number(req.user.agencyId)) {
    return null;
  }

  if (req.user.role === 'CLIENT' && Number(project.clientId) !== Number(userContext.client.id)) {
    return null;
  }

  return project;
};

const getAgencyAiProjectSummary = async (req, res) => {
  try {
    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.generateSummary({ project, role: req.user.role });
    return res.status(200).json({
      success: true,
      summary: response.summary,
      keyPoints: response.keyPoints,
      risks: response.risks,
      recommendations: response.recommendations,
      nextActions: response.nextActions,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate project summary' });
  }
};

const getClientAiProjectSummary = async (req, res) => {
  try {
    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.generateSummary({ project, role: 'CLIENT' });
    return res.status(200).json({
      success: true,
      summary: response.summary,
      keyPoints: response.keyPoints,
      risks: response.risks,
      recommendations: response.recommendations,
      nextActions: response.nextActions,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate project summary' });
  }
};

const getAgencyAiProjectInsights = async (req, res) => {
  try {
    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.generateInsights({ project, role: req.user.role });
    return res.status(200).json({
      success: true,
      insights: response.insights,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate project insights' });
  }
};

const getClientAiProjectInsights = async (req, res) => {
  try {
    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.generateInsights({ project, role: 'CLIENT' });
    return res.status(200).json({
      success: true,
      insights: response.insights,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate project insights' });
  }
};

const askAgencyProjectQuestion = async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
      return res.status(400).json({ success: false, message: 'A question is required' });
    }

    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.answerQuestion({ project, role: req.user.role, question });
    return res.status(200).json({
      success: true,
      answer: response.answer,
      summary: response.summary,
      keyPoints: response.keyPoints,
      risks: response.risks,
      recommendations: response.recommendations,
      nextActions: response.nextActions,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to answer project question' });
  }
};

const askClientProjectQuestion = async (req, res) => {
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (!question) {
      return res.status(400).json({ success: false, message: 'A question is required' });
    }

    const project = await getProjectForAi(req, { client: { id: req.user.clientId || null } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const response = await projectAiService.answerQuestion({ project, role: 'CLIENT', question });
    return res.status(200).json({
      success: true,
      answer: response.answer,
      summary: response.summary,
      keyPoints: response.keyPoints,
      risks: response.risks,
      recommendations: response.recommendations,
      nextActions: response.nextActions,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to answer project question' });
  }
};

const getMeetingForAi = async (req, userContext) => {
  const projectId = Number(req.params.projectId || req.params.id);
  const meetingId = Number(req.params.meetingId || req.params.meeting_id);

  if (!projectId || !meetingId) {
    return null;
  }

  const project = await getProjectForAi({ ...req, params: { ...req.params, id: String(projectId) } }, userContext);
  if (!project) {
    return null;
  }

  const meeting = await Meeting.findOne({
    where: { id: meetingId, projectId: project.id, agencyId: req.user.agencyId },
    include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }]
  });

  if (!meeting) {
    return null;
  }

  if (req.user.role === 'CLIENT' && meeting.visibility === 'AGENCY_ONLY') {
    return null;
  }

  return { project, meeting };
};

const getAgencyMeetingAiSummary = async (req, res) => {
  try {
    const match = await getMeetingForAi(req, { client: { id: req.user.clientId || null } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const response = await projectAiService.generateMeetingSummary({
      meeting: match.meeting,
      project: match.project,
      role: req.user.role
    });

    return res.status(200).json({
      success: true,
      summary: response.summary,
      decisions: response.decisions,
      actionItems: response.actionItems,
      deadlines: response.deadlines,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate meeting summary' });
  }
};

const getClientMeetingAiSummary = async (req, res) => {
  try {
    const match = await getMeetingForAi(req, { client: { id: req.user.clientId || null } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const response = await projectAiService.generateMeetingSummary({
      meeting: match.meeting,
      project: match.project,
      role: 'CLIENT'
    });

    return res.status(200).json({
      success: true,
      summary: response.summary,
      decisions: response.decisions,
      actionItems: response.actionItems,
      deadlines: response.deadlines,
      source: response.source,
      context: response.context
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to generate meeting summary' });
  }
};

const resolveAssigneeId = async (value, agencyId) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const asNumber = Number(value);
  if (Number.isInteger(asNumber) && asNumber > 0) {
    const user = await User.findOne({
      where: { id: asNumber, agencyId },
      attributes: ['id']
    });
    return user ? user.id : null;
  }

  const user = await User.findOne({
    where: { agencyId, name: String(value).trim() },
    attributes: ['id']
  });

  return user ? user.id : null;
};

const createAgencyMeetingActionTasks = async (req, res) => {
  try {
    if (req.user.role !== 'AGENCY_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only agency admins can create tasks from AI action items' });
    }

    const match = await getMeetingForAi(req, { client: { id: req.user.clientId || null } });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const rawItems = Array.isArray(req.body?.actionItems) ? req.body.actionItems : (
      Array.isArray(req.body?.items) ? req.body.items : [req.body]
    );

    if (!rawItems.length) {
      return res.status(400).json({ success: false, message: 'At least one action item is required' });
    }

    const tasks = [];
    for (const item of rawItems) {
      const actionItem = item && typeof item === 'object' ? item : { title: String(item || '').trim() };
      if (!actionItem.title || !String(actionItem.title).trim()) {
        continue;
      }

      const dueDate = actionItem.dueDate || actionItem.deadline || null;
      const assigneeId = await resolveAssigneeId(actionItem.assigneeId ?? actionItem.assignee ?? actionItem.owner, req.user.agencyId);
      const taskPayload = await projectAiService.createTaskFromActionItem({
        project: match.project,
        meeting: match.meeting,
        actionItem,
        agencyId: req.user.agencyId,
        creatorId: req.user.id,
        assigneeId,
        dueDate
      });

      const task = await Task.create({
        title: taskPayload.title,
        description: taskPayload.description || null,
        projectId: taskPayload.projectId,
        agencyId: taskPayload.agencyId,
        assigneeId: taskPayload.assigneeId,
        status: taskPayload.status,
        priority: taskPayload.priority,
        dueDate: taskPayload.dueDate
      });

      tasks.push(task);
    }

    return res.status(201).json({
      success: true,
      created: tasks.length,
      tasks
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Unable to create action items as tasks' });
  }
};

module.exports = {
  getAgencyAiProjectSummary,
  getClientAiProjectSummary,
  getAgencyAiProjectInsights,
  getClientAiProjectInsights,
  askAgencyProjectQuestion,
  askClientProjectQuestion,
  getAgencyMeetingAiSummary,
  getClientMeetingAiSummary,
  createAgencyMeetingActionTasks,
};
