const { Op } = require('sequelize');
const {
  Project,
  Client,
  User,
  Task,
  Meeting,
  ProjectFeedback,
  ProjectActivity,
  Notification,
  ProjectFile,
  Milestone,
} = require('../models');

const buildDashboardFilters = (from, to) => {
  const range = {};
  if (from) {
    range[Op.gte] = new Date(from);
  }
  if (to) {
    range[Op.lte] = new Date(to);
  }
  return Object.keys(range).length ? range : undefined;
};

const getProjectProgress = (project) => {
  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const total = tasks.length;
  if (total === 0) return 0;
  const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
  return Math.round((completed / total) * 100);
};

class DashboardService {
  static async getAgencyDashboard({ agencyId, userId, from = null, to = null }) {
    const projectWhere = { agencyId };
    const projectStatusCounts = {};
    const allProjects = await Project.findAll({
      where: projectWhere,
      attributes: ['id', 'name', 'status', 'clientId', 'managerId', 'createdAt'],
      include: [
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        { model: User, as: 'manager', attributes: ['id', 'name'] },
        { model: Task, as: 'tasks', attributes: ['id', 'status', 'dueDate'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    for (const project of allProjects) {
      const key = project.status || 'UNKNOWN';
      projectStatusCounts[key] = (projectStatusCounts[key] || 0) + 1;
    }

    const totalActiveProjects = allProjects.filter((project) => !['COMPLETED', 'CANCELLED'].includes(project.status)).length;
    const totalCompletedProjects = allProjects.filter((project) => project.status === 'COMPLETED').length;
    const totalClients = await Client.count({ where: { agencyId } });
    const totalTeamMembers = await User.count({
      where: {
        agencyId,
        role: { [Op.in]: ['AGENCY_ADMIN', 'AGENCY_TEAM'] },
      },
    });

    const openTasks = await Task.count({
      where: {
        agencyId,
        status: { [Op.ne]: 'COMPLETED' },
      },
    });

    const overdueTasksCount = await Task.count({
      where: {
        agencyId,
        status: { [Op.ne]: 'COMPLETED' },
        dueDate: { [Op.lt]: new Date() },
      },
    });

    const tasksDueSoon = await Task.count({
      where: {
        agencyId,
        status: { [Op.ne]: 'COMPLETED' },
        dueDate: {
          [Op.gte]: new Date(),
          [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const projectStatus = Object.entries(projectStatusCounts).map(([status, count]) => ({ status, count }));

    const projectProgress = allProjects
      .filter((project) => !['COMPLETED', 'CANCELLED'].includes(project.status))
      .map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        progress: getProjectProgress(project),
        client: project.client ? { id: project.client.id, companyName: project.client.companyName } : null,
      }))
      .slice(0, 8);

    const overdueTasks = await Task.findAll({
      where: {
        agencyId,
        status: { [Op.ne]: 'COMPLETED' },
        dueDate: { [Op.lt]: new Date() },
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'name', 'role'] },
      ],
      order: [['dueDate', 'ASC']],
      limit: 10,
    });

    const upcomingMeetings = await Meeting.findAll({
      where: {
        agencyId,
        status: { [Op.ne]: 'CANCELLED' },
        meetingDate: { [Op.gte]: new Date().toISOString().slice(0, 10) },
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: Client, as: 'client', attributes: ['id', 'companyName'] },
      ],
      order: [['meetingDate', 'ASC'], ['startTime', 'ASC']],
      limit: 8,
    });

    const openFeedback = ProjectFeedback && typeof ProjectFeedback.findAll === 'function'
      ? await ProjectFeedback.findAll({
        where: {
          agencyId,
          status: { [Op.in]: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] },
        },
        include: [
          { model: Project, as: 'project', attributes: ['id', 'name'] },
          { model: Client, as: 'client', attributes: ['id', 'companyName'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 8,
      })
      : [];

    const feedbackCounts = {
      totalOpen: ProjectFeedback && typeof ProjectFeedback.count === 'function' ? await ProjectFeedback.count({ where: { agencyId, status: 'OPEN' } }) : 0,
      inReview: ProjectFeedback && typeof ProjectFeedback.count === 'function' ? await ProjectFeedback.count({ where: { agencyId, status: 'IN_REVIEW' } }) : 0,
      inProgress: ProjectFeedback && typeof ProjectFeedback.count === 'function' ? await ProjectFeedback.count({ where: { agencyId, status: 'IN_PROGRESS' } }) : 0,
      resolved: ProjectFeedback && typeof ProjectFeedback.count === 'function' ? await ProjectFeedback.count({ where: { agencyId, status: 'RESOLVED' } }) : 0,
      rejected: ProjectFeedback && typeof ProjectFeedback.count === 'function' ? await ProjectFeedback.count({ where: { agencyId, status: 'REJECTED' } }) : 0,
    };

    const teamWorkload = await User.findAll({
      where: {
        agencyId,
        role: { [Op.in]: ['AGENCY_ADMIN', 'AGENCY_TEAM'] },
      },
      attributes: ['id', 'name', 'role'],
      include: [{ model: Task, as: 'assignedTasks', attributes: ['id', 'status', 'dueDate'], required: false }],
      order: [['name', 'ASC']],
    });

    const team = teamWorkload.map((member) => {
      const tasks = Array.isArray(member.assignedTasks) ? member.assignedTasks : [];
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        assignedOpenTasks: tasks.filter((task) => task.status !== 'COMPLETED').length,
        overdueTasks: tasks.filter((task) => task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date()).length,
        completedTasks: tasks.filter((task) => task.status === 'COMPLETED').length,
      };
    });

    const recentActivity = await ProjectActivity.findAll({
      where: { agencyId },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 8,
    });

    const notifications = await Notification.findAll({
      where: { agencyId, recipientUserId: userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    const fromRange = buildDashboardFilters(from, to);
    if (fromRange) {
      const filteredMeetings = await Meeting.findAll({
        where: {
          agencyId,
          status: { [Op.ne]: 'CANCELLED' },
          meetingDate: fromRange,
        },
        include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
        order: [['meetingDate', 'ASC']],
        limit: 8,
      });

      return {
        success: true,
        dashboard: {
          summary: {
            totalActiveProjects,
            totalCompletedProjects,
            totalClients,
            totalTeamMembers,
            openTasks,
            overdueTasks: overdueTasksCount,
            tasksDueSoon,
          },
          projectStatus,
          projects: projectProgress,
          overdueTasks: overdueTasks.map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            dueDate: task.dueDate,
            project: task.project ? { id: task.project.id, name: task.project.name } : null,
            assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
          })),
          meetings: filteredMeetings.map((meeting) => ({
            id: meeting.id,
            title: meeting.title,
            status: meeting.status,
            meetingDate: meeting.meetingDate,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            project: meeting.project ? { id: meeting.project.id, name: meeting.project.name } : null,
          })),
          feedback: { ...feedbackCounts, recent: openFeedback.map((feedback) => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            type: feedback.type,
            priority: feedback.priority,
            project: feedback.project ? { id: feedback.project.id, name: feedback.project.name } : null,
            client: feedback.client ? { id: feedback.client.id, companyName: feedback.client.companyName } : null,
            createdAt: feedback.createdAt,
          })) },
          team,
          activity: recentActivity.map((activity) => ({
            id: activity.id,
            description: activity.description,
            activityType: activity.activityType,
            createdAt: activity.createdAt,
            project: activity.project ? { id: activity.project.id, name: activity.project.name } : null,
            actor: activity.creator ? { id: activity.creator.id, name: activity.creator.name, role: activity.creator.role } : null,
          })),
          notifications: notifications.map((item) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type,
            readAt: item.readAt,
            createdAt: item.createdAt,
          })),
        },
      };
    }

    return {
      success: true,
      dashboard: {
        summary: {
          totalActiveProjects,
          totalCompletedProjects,
          totalClients,
          totalTeamMembers,
          openTasks,
          overdueTasks: overdueTasksCount,
          tasksDueSoon,
        },
        projectStatus,
        projects: projectProgress,
        overdueTasks: overdueTasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate,
          project: task.project ? { id: task.project.id, name: task.project.name } : null,
          assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
        })),
        meetings: upcomingMeetings.map((meeting) => ({
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          project: meeting.project ? { id: meeting.project.id, name: meeting.project.name } : null,
          client: meeting.client ? { id: meeting.client.id, companyName: meeting.client.companyName } : null,
          meetingLink: meeting.meetingLink || null,
        })),
        feedback: {
          ...feedbackCounts,
          recent: openFeedback.map((feedback) => ({
            id: feedback.id,
            title: feedback.title,
            status: feedback.status,
            type: feedback.type,
            priority: feedback.priority,
            project: feedback.project ? { id: feedback.project.id, name: feedback.project.name } : null,
            client: feedback.client ? { id: feedback.client.id, companyName: feedback.client.companyName } : null,
            createdAt: feedback.createdAt,
          })),
        },
        team,
        activity: recentActivity.map((activity) => ({
          id: activity.id,
          description: activity.description,
          activityType: activity.activityType,
          createdAt: activity.createdAt,
          project: activity.project ? { id: activity.project.id, name: activity.project.name } : null,
          actor: activity.creator ? { id: activity.creator.id, name: activity.creator.name, role: activity.creator.role } : null,
        })),
        notifications: notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          type: item.type,
          readAt: item.readAt,
          createdAt: item.createdAt,
        })),
      },
    };
  }

  static async getClientDashboard({ agencyId, clientId, userId, from = null, to = null }) {
    const projectWhere = { agencyId, clientId };
    const projects = await Project.findAll({
      where: projectWhere,
      attributes: ['id', 'name', 'status', 'clientId', 'createdAt'],
      include: [
        { model: Task, as: 'tasks', attributes: ['id', 'status', 'dueDate'], required: false },
        { model: Meeting, as: 'meetings', attributes: ['id', 'title', 'status', 'meetingDate', 'startTime', 'endTime'], required: false },
        { model: ProjectFeedback, as: 'feedback', attributes: ['id', 'status'], required: false },
      ],
      order: [['createdAt', 'DESC']],
    });

    const activeProjects = projects.filter((project) => !['COMPLETED', 'CANCELLED'].includes(project.status));
    const completedProjects = projects.filter((project) => project.status === 'COMPLETED');
    const today = new Date().toISOString().slice(0, 10);
    const upcomingMeetings = await Meeting.findAll({
      where: {
        agencyId,
        clientId,
        status: { [Op.ne]: 'CANCELLED' },
        visibility: 'CLIENT_VISIBLE',
        meetingDate: { [Op.gte]: today },
      },
      include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
      order: [['meetingDate', 'ASC'], ['startTime', 'ASC']],
      limit: 6,
    });

    const openRequests = await ProjectFeedback.count({
      where: { agencyId, clientId, status: { [Op.in]: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] } },
    });

    const projectIds = projects.map((project) => project.id);
    const projectFiles = ProjectFile && typeof ProjectFile.findAll === 'function'
      ? await ProjectFile.findAll({
        where: {
          agencyId,
          clientId,
          visibility: 'CLIENT_VISIBLE',
          ...(projectIds.length ? { projectId: { [Op.in]: projectIds } } : { projectId: -1 }),
        },
        include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
        order: [['createdAt', 'DESC']],
        limit: 6,
      })
      : [];

    const projectActivity = ProjectActivity && typeof ProjectActivity.findAll === 'function'
      ? await ProjectActivity.findAll({
        where: {
          agencyId,
          clientId,
          visibility: 'CLIENT_VISIBLE',
          ...(projectIds.length ? { projectId: { [Op.in]: projectIds } } : { projectId: -1 }),
        },
        include: [
          { model: Project, as: 'project', attributes: ['id', 'name'] },
          { model: User, as: 'creator', attributes: ['id', 'name', 'role'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 6,
      })
      : [];

    const unreadNotifications = Notification && typeof Notification.count === 'function'
      ? await Notification.count({ where: { agencyId, recipientUserId: userId, readAt: null } })
      : 0;

    const projectSummaries = await Promise.all(
      activeProjects.map(async (project) => {
        const nextMilestone = Milestone && typeof Milestone.findOne === 'function'
          ? await Milestone.findOne({
            where: { agencyId, projectId: project.id, status: { [Op.ne]: 'COMPLETED' } },
            order: [['dueDate', 'ASC']],
            attributes: ['id', 'name', 'status', 'dueDate'],
          })
          : null;
        const nextMeeting = (project.meetings || []).find((meeting) => meeting.status !== 'CANCELLED' && meeting.meetingDate >= today) || null;
        const openFeedbackCount = (project.feedback || []).filter((feedback) => ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'].includes(feedback.status)).length;
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          progress: getProjectProgress(project),
          nextMilestone: nextMilestone ? { id: nextMilestone.id, name: nextMilestone.name, status: nextMilestone.status, dueDate: nextMilestone.dueDate } : null,
          upcomingMeeting: nextMeeting ? { id: nextMeeting.id, title: nextMeeting.title, meetingDate: nextMeeting.meetingDate, startTime: nextMeeting.startTime, endTime: nextMeeting.endTime } : null,
          openFeedbackCount,
        };
      })
    );

    return {
      success: true,
      dashboard: {
        summary: {
          totalActiveProjects: activeProjects.length,
          totalCompletedProjects: completedProjects.length,
          upcomingMeetings: upcomingMeetings.length,
          openFeedbackRequests: openRequests,
          unreadNotifications,
        },
        projects: projectSummaries,
        meetings: upcomingMeetings.map((meeting) => ({
          id: meeting.id,
          title: meeting.title,
          status: meeting.status,
          meetingDate: meeting.meetingDate,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          project: meeting.project ? { id: meeting.project.id, name: meeting.project.name } : null,
          meetingLink: meeting.meetingLink || null,
        })),
        feedback: {
          openRequests,
          recent: (await ProjectFeedback.findAll({
            where: { agencyId, clientId, status: { [Op.in]: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS'] } },
            include: [{ model: Project, as: 'project', attributes: ['id', 'name'] }],
            order: [['createdAt', 'DESC']],
            limit: 6,
          })).map((feedback) => ({
            id: feedback.id,
            title: feedback.title,
            type: feedback.type,
            priority: feedback.priority,
            status: feedback.status,
            project: feedback.project ? { id: feedback.project.id, name: feedback.project.name } : null,
            createdAt: feedback.createdAt,
          })),
        },
        files: projectFiles.map((file) => ({
          id: file.id,
          originalName: file.originalName,
          project: file.project ? { id: file.project.id, name: file.project.name } : null,
          category: file.category,
          createdAt: file.createdAt,
        })),
        activity: projectActivity.map((activity) => ({
          id: activity.id,
          description: activity.description,
          activityType: activity.activityType,
          createdAt: activity.createdAt,
          project: activity.project ? { id: activity.project.id, name: activity.project.name } : null,
          actor: activity.creator ? { id: activity.creator.id, name: activity.creator.name, role: activity.creator.role } : null,
        })),
        unreadNotifications,
      },
    };
  }
}

module.exports = DashboardService;
