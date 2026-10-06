const { Meeting, Project, Client, User, ProjectActivity } = require('../models');
const { Op } = require('sequelize');
const NotificationService = require('../services/notification.service');

const meetingStatusSet = new Set(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']);
const meetingTypeSet = new Set(['CLIENT', 'TEAM', 'INTERNAL', 'CHECKIN']);
const visibilitySet = new Set(['CLIENT_VISIBLE', 'AGENCY_ONLY']);

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
  updatedAt: meeting.updatedAt,
  creator: meeting.creator ? {
    id: meeting.creator.id,
    name: meeting.creator.name,
    email: meeting.creator.email,
    role: meeting.creator.role
  } : null,
  client: meeting.client ? {
    id: meeting.client.id,
    companyName: meeting.client.companyName
  } : null
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
    visibility: visibility || 'CLIENT_VISIBLE'
  });
};

const getProjectMeetings = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId', 'clientId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const { status, search, limit = 20, page = 1 } = req.query;
    const where = { projectId: project.id, agencyId: req.user.agencyId };

    if (status) where.status = status;
    if (search) where.title = { [Op.like]: `%${String(search).trim()}%` };

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Meeting.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['meetingDate', 'ASC'], ['startTime', 'ASC'], ['createdAt', 'DESC']],
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] }
      ]
    });

    return res.status(200).json({
      success: true,
      meetings: rows,
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

const createMeeting = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId || req.body.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId', 'clientId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const { title, description, meetingDate, startTime, endTime, meetingType, status, visibility, location, meetingLink, clientId } = req.body;
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';

    if (!trimmedTitle) {
      return res.status(400).json({ success: false, message: 'Meeting title is required' });
    }

    if (!meetingDate || Number.isNaN(new Date(meetingDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Meeting date is required' });
    }

    const normalizedMeetingType = meetingType || 'CLIENT';
    const normalizedStatus = status || 'SCHEDULED';
    const normalizedVisibility = visibility || 'CLIENT_VISIBLE';

    if (!meetingTypeSet.has(normalizedMeetingType)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting type' });
    }

    if (!meetingStatusSet.has(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting status' });
    }

    if (!visibilitySet.has(normalizedVisibility)) {
      return res.status(400).json({ success: false, message: 'Invalid meeting visibility' });
    }

    const targetClientId = Number(clientId ?? project.clientId);
    if (!Number.isInteger(targetClientId) || targetClientId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid client is required' });
    }

    const client = await Client.findOne({
      where: { id: targetClientId, agencyId: req.user.agencyId }
    });

    if (!client) {
      return res.status(400).json({ success: false, message: 'Client must belong to the same agency' });
    }

    const meeting = await Meeting.create({
      title: trimmedTitle,
      description: description || null,
      status: normalizedStatus,
      meetingType: normalizedMeetingType,
      visibility: normalizedVisibility,
      location: location || null,
      meetingLink: meetingLink || null,
      meetingDate,
      startTime: startTime || null,
      endTime: endTime || null,
      agencyId: req.user.agencyId,
      clientId: targetClientId,
      projectId: project.id,
      createdBy: req.user.id
    });

    await createProjectActivityEntry({
      agencyId: req.user.agencyId,
      projectId: project.id,
      clientId: targetClientId,
      createdBy: req.user.id,
      activityType: 'MEETING_CREATED',
      description: `Meeting scheduled: ${meeting.title}`,
      visibility: normalizedVisibility
    });

    const agencyUsers = await NotificationService.findAgencyUsers(req.user.agencyId, ['AGENCY_ADMIN', 'AGENCY_TEAM'], [req.user.id]);
    const clientUsers = await NotificationService.findClientUsers(req.user.agencyId, project.clientId, [req.user.id]);
    const notifications = [
      ...agencyUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_CREATED',
        title: 'New meeting scheduled',
        message: `A new meeting, "${meeting.title}", was scheduled for ${meeting.meetingDate}.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: project.id,
        metadata: { meetingId: meeting.id, date: meeting.meetingDate }
      })),
      ...clientUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_CREATED',
        title: 'New meeting scheduled',
        message: `A new meeting, "${meeting.title}", was scheduled for ${meeting.meetingDate}.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: project.id,
        metadata: { meetingId: meeting.id, date: meeting.meetingDate }
      }))
    ];

    if (notifications.length) {
      await NotificationService.createNotifications(notifications);
    }

    return res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getMeetingById = async (req, res) => {
  try {
    const meetingId = Number(req.params.id);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
    }

    const meeting = await Meeting.findOne({
      where: { id: meetingId, agencyId: req.user.agencyId },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'clientId'] }
      ]
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not in your agency' });
    }

    return res.status(200).json({ success: true, meeting: meeting.toJSON ? meeting.toJSON() : meeting });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meetingId = Number(req.params.id);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
    }

    const meeting = await Meeting.findOne({
      where: { id: meetingId, agencyId: req.user.agencyId }
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not in your agency' });
    }

    const { title, description, meetingDate, startTime, endTime, meetingType, status, visibility, location, meetingLink, projectId, clientId } = req.body;

    if (projectId !== undefined && projectId !== null && projectId !== '') {
      const project = await Project.findOne({
        where: { id: projectId, agencyId: req.user.agencyId },
        attributes: ['id', 'agencyId', 'clientId']
      });

      if (!project) {
        return res.status(400).json({ success: false, message: 'Project must belong to the same agency' });
      }
      meeting.projectId = Number(projectId);
    }

    if (clientId !== undefined && clientId !== null && clientId !== '') {
      const client = await Client.findOne({
        where: { id: clientId, agencyId: req.user.agencyId }
      });
      if (!client) {
        return res.status(400).json({ success: false, message: 'Client must belong to the same agency' });
      }
      meeting.clientId = Number(clientId);
    }

    if (title !== undefined) {
      const trimmedTitle = typeof title === 'string' ? title.trim() : '';
      if (!trimmedTitle) {
        return res.status(400).json({ success: false, message: 'Meeting title is required' });
      }
      meeting.title = trimmedTitle;
    }

    if (description !== undefined) meeting.description = description || null;
    if (meetingDate !== undefined) {
      if (!meetingDate || Number.isNaN(new Date(meetingDate).getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid meeting date' });
      }
      meeting.meetingDate = meetingDate;
    }
    if (startTime !== undefined) meeting.startTime = startTime || null;
    if (endTime !== undefined) meeting.endTime = endTime || null;
    if (meetingType !== undefined) {
      if (!meetingTypeSet.has(meetingType)) {
        return res.status(400).json({ success: false, message: 'Invalid meeting type' });
      }
      meeting.meetingType = meetingType;
    }
    if (status !== undefined) {
      if (!meetingStatusSet.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid meeting status' });
      }
      meeting.status = status;
    }
    if (visibility !== undefined) {
      if (!visibilitySet.has(visibility)) {
        return res.status(400).json({ success: false, message: 'Invalid meeting visibility' });
      }
      meeting.visibility = visibility;
    }
    if (location !== undefined) meeting.location = location || null;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink || null;

    await meeting.save();

    await createProjectActivityEntry({
      agencyId: req.user.agencyId,
      projectId: meeting.projectId,
      clientId: meeting.clientId,
      createdBy: req.user.id,
      activityType: 'MEETING_UPDATED',
      description: `Meeting updated: ${meeting.title}`,
      visibility: meeting.visibility
    });

    const agencyUsers = await NotificationService.findAgencyUsers(req.user.agencyId, ['AGENCY_ADMIN', 'AGENCY_TEAM'], [req.user.id]);
    const clientUsers = await NotificationService.findClientUsers(req.user.agencyId, meeting.clientId, [req.user.id]);
    const notifications = [
      ...agencyUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_UPDATED',
        title: 'Meeting updated',
        message: `Meeting "${meeting.title}" was updated.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: meeting.projectId,
        metadata: { meetingId: meeting.id }
      })),
      ...clientUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_UPDATED',
        title: 'Meeting updated',
        message: `Meeting "${meeting.title}" was updated.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: meeting.projectId,
        metadata: { meetingId: meeting.id }
      }))
    ];

    if (notifications.length) {
      await NotificationService.createNotifications(notifications);
    }

    return res.status(200).json({ success: true, meeting });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const cancelMeeting = async (req, res) => {
  try {
    const meetingId = Number(req.params.id);
    if (!Number.isInteger(meetingId) || meetingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
    }

    const meeting = await Meeting.findOne({
      where: { id: meetingId, agencyId: req.user.agencyId }
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found or not in your agency' });
    }

    meeting.status = 'CANCELLED';
    await meeting.save();

    await createProjectActivityEntry({
      agencyId: req.user.agencyId,
      projectId: meeting.projectId,
      clientId: meeting.clientId,
      createdBy: req.user.id,
      activityType: 'MEETING_CANCELLED',
      description: `Meeting cancelled: ${meeting.title}`,
      visibility: meeting.visibility
    });

    const agencyUsers = await NotificationService.findAgencyUsers(req.user.agencyId, ['AGENCY_ADMIN', 'AGENCY_TEAM'], [req.user.id]);
    const clientUsers = await NotificationService.findClientUsers(req.user.agencyId, meeting.clientId, [req.user.id]);
    const notifications = [
      ...agencyUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_CANCELLED',
        title: 'Meeting cancelled',
        message: `Meeting "${meeting.title}" was cancelled.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: meeting.projectId,
        metadata: { meetingId: meeting.id }
      })),
      ...clientUsers.map((user) => ({
        agencyId: req.user.agencyId,
        recipientUserId: user.id,
        actorUserId: req.user.id,
        type: 'MEETING_CANCELLED',
        title: 'Meeting cancelled',
        message: `Meeting "${meeting.title}" was cancelled.`,
        entityType: 'MEETING',
        entityId: meeting.id,
        projectId: meeting.projectId,
        metadata: { meetingId: meeting.id }
      }))
    ];

    if (notifications.length) {
      await NotificationService.createNotifications(notifications);
    }

    return res.status(200).json({ success: true, message: 'Meeting cancelled successfully', meeting });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getProjectActivity = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const project = await Project.findOne({
      where: { id: projectId, agencyId: req.user.agencyId },
      attributes: ['id', 'agencyId']
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not in your agency' });
    }

    const { limit = 20, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await ProjectActivity.findAndCountAll({
      where: {
        projectId: project.id,
        agencyId: req.user.agencyId
      },
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] }]
    });

    return res.status(200).json({
      success: true,
      activities: rows,
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

module.exports = {
  getProjectMeetings,
  createMeeting,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  getProjectActivity
};
