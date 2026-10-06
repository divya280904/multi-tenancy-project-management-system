const { ProjectFeedback, Project, Client, User, ProjectActivity } = require('../models');

const feedbackTypeSet = new Set(['FEEDBACK', 'CHANGE_REQUEST', 'BUG', 'QUESTION']);
const feedbackPrioritySet = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const feedbackStatusSet = new Set(['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']);

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

const createProjectActivityEntry = async ({ agencyId, projectId, clientId, createdBy, activityType, description, visibility = 'CLIENT_VISIBLE' }) => {
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
    visibility
  });
};

const listAgencyFeedback = async (req, res) => {
  try {
    const { status, type, priority, projectId, clientId } = req.query;
    const where = { agencyId: req.user.agencyId };

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (clientId) where.clientId = clientId;

    const { count, rows } = await ProjectFeedback.findAndCountAll({
      where,
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'responder', attributes: ['id', 'name', 'email', 'role'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      feedback: rows.map(serializeFeedback),
      pagination: {
        total: count,
        page: 1,
        pages: Math.ceil(count / (rows.length || 1)) || 1
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAgencyFeedbackById = async (req, res) => {
  try {
    const feedbackId = Number(req.params.id);
    const feedback = await ProjectFeedback.findOne({
      where: { id: feedbackId, agencyId: req.user.agencyId },
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

const updateAgencyFeedback = async (req, res) => {
  try {
    const feedbackId = Number(req.params.id);
    const feedback = await ProjectFeedback.findOne({
      where: { id: feedbackId, agencyId: req.user.agencyId }
    });

    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    const { title, description, type, priority, status, agencyResponse } = req.body;
    const previousStatus = feedback.status;
    const nextTitle = typeof title === 'string' ? title.trim() : feedback.title;
    const nextDescription = typeof description === 'string' ? description.trim() : feedback.description;
    const nextType = typeof type === 'string' ? type.toUpperCase() : feedback.type;
    const nextPriority = typeof priority === 'string' ? priority.toUpperCase() : feedback.priority;
    const nextStatus = typeof status === 'string' ? status.toUpperCase() : feedback.status;
    const nextAgencyResponse = typeof agencyResponse === 'string' ? agencyResponse.trim() : feedback.agencyResponse;

    if (nextTitle && !nextTitle.length) {
      return res.status(400).json({ success: false, message: 'Feedback title is required' });
    }
    if (nextDescription && !nextDescription.length) {
      return res.status(400).json({ success: false, message: 'Feedback description is required' });
    }
    if (nextType && !feedbackTypeSet.has(nextType)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback type' });
    }
    if (nextPriority && !feedbackPrioritySet.has(nextPriority)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback priority' });
    }
    if (nextStatus && !feedbackStatusSet.has(nextStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid feedback status' });
    }

    if (nextTitle) feedback.title = nextTitle;
    if (nextDescription) feedback.description = nextDescription;
    if (nextType) feedback.type = nextType;
    if (nextPriority) feedback.priority = nextPriority;
    if (nextStatus) feedback.status = nextStatus;
    if (nextAgencyResponse !== undefined) {
      feedback.agencyResponse = nextAgencyResponse || null;
      feedback.respondedBy = req.user.id;
      feedback.respondedAt = new Date();
    }

    if (nextStatus) {
      if (['RESOLVED', 'REJECTED'].includes(nextStatus)) {
        feedback.resolvedAt = feedback.resolvedAt || new Date();
      } else if (previousStatus !== nextStatus && feedback.resolvedAt) {
        feedback.resolvedAt = null;
      }
    }

    await feedback.save();

    let activityType = 'FEEDBACK_STATUS_CHANGED';
    let activityDescription = `Feedback status updated to ${feedback.status}`;

    if (nextAgencyResponse !== undefined && (nextAgencyResponse || feedback.agencyResponse)) {
      activityType = feedback.status === 'RESOLVED' ? 'FEEDBACK_RESOLVED' : feedback.status === 'REJECTED' ? 'FEEDBACK_REJECTED' : 'FEEDBACK_RESPONDED';
      activityDescription = feedback.status === 'RESOLVED'
        ? `Feedback resolved: ${feedback.title}`
        : feedback.status === 'REJECTED'
          ? `Feedback rejected: ${feedback.title}`
          : `Agency response added to feedback: ${feedback.title}`;
    } else if (nextStatus && previousStatus !== nextStatus) {
      activityDescription = `Feedback status changed to ${feedback.status}`;
    }

    await createProjectActivityEntry({
      agencyId: feedback.agencyId,
      projectId: feedback.projectId,
      clientId: feedback.clientId,
      createdBy: req.user.id,
      activityType,
      description: activityDescription,
      visibility: 'CLIENT_VISIBLE'
    });

    return res.status(200).json({ success: true, feedback: serializeFeedback(feedback) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  listAgencyFeedback,
  getAgencyFeedbackById,
  updateAgencyFeedback,
  serializeFeedback
};
