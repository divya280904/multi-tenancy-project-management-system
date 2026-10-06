const SECRET_KEYS = new Set([
  'password',
  'passwordHash',
  'apiKey',
  'secret',
  'token',
  'jwt',
  'authorization',
  'session',
  'cookie',
  'privateKey',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
  'JWT_SECRET'
]);

const stripSecrets = (value, seen = new WeakSet()) => {
  if (value === null || value === undefined) return value;
  
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(v => stripSecrets(v, seen)).filter((entry) => entry !== undefined);
  }

  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[Circular]';
    }
    seen.add(value);

    let target = value;
    if (typeof value.toJSON === 'function') {
      try {
        target = value.toJSON();
      } catch (e) {}
    }

    return Object.entries(target).reduce((acc, [key, nestedValue]) => {
      if (SECRET_KEYS.has(key) || String(key).toLowerCase().includes('secret') || String(key).toLowerCase().includes('token') || String(key).toLowerCase().includes('apikey')) {
        return acc;
      }
      acc[key] = stripSecrets(nestedValue, seen);
      return acc;
    }, {});
  }

  return value;
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const buildProjectContext = ({ project, role = 'AGENCY_ADMIN' }) => {
  if (!project) {
    return { project: null, role, generatedAt: new Date().toISOString() };
  }

  const normalizedProject = stripSecrets(project);
  const tasks = Array.isArray(normalizedProject.tasks) ? normalizedProject.tasks : [];
  const milestones = Array.isArray(normalizedProject.milestones) ? normalizedProject.milestones : [];
  const meetings = Array.isArray(normalizedProject.meetings) ? normalizedProject.meetings : [];
  const feedback = Array.isArray(normalizedProject.feedback) ? normalizedProject.feedback : [];
  const activities = Array.isArray(normalizedProject.activities) ? normalizedProject.activities : [];

  const safeProject = {
    id: normalizedProject.id,
    name: normalizedProject.name,
    description: normalizedProject.description,
    status: normalizedProject.status,
    priority: normalizedProject.priority,
    startDate: normalizeDate(normalizedProject.startDate),
    expectedCompletionDate: normalizeDate(normalizedProject.expectedCompletionDate),
    agencyId: normalizedProject.agencyId,
    clientId: normalizedProject.clientId,
    manager: normalizedProject.manager ? { id: normalizedProject.manager.id, name: normalizedProject.manager.name } : null,
    milestones: milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      status: milestone.status,
      dueDate: normalizeDate(milestone.dueDate),
      order: milestone.order
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: normalizeDate(task.dueDate),
      milestoneId: task.milestoneId,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null,
      description: task.description || null
    })),
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      meetingDate: normalizeDate(meeting.meetingDate),
      startTime: meeting.startTime || null,
      endTime: meeting.endTime || null,
      visibility: meeting.visibility || null,
      meetingType: meeting.meetingType || null,
      location: meeting.location || null
    })),
    feedback: feedback.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      priority: item.priority,
      status: item.status,
      createdAt: normalizeDate(item.createdAt)
    })),
    activities: activities
      .filter((activity) => role !== 'CLIENT' || activity.visibility !== 'AGENCY_ONLY')
      .map((activity) => ({
        id: activity.id,
        activityType: activity.activityType,
        description: activity.description,
        visibility: activity.visibility || 'CLIENT_VISIBLE',
        createdAt: normalizeDate(activity.createdAt)
      }))
  };

  if (role === 'CLIENT') {
    safeProject.manager = safeProject.manager ? { id: safeProject.manager.id, name: safeProject.manager.name } : null;
    safeProject.milestones = safeProject.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      status: milestone.status,
      dueDate: milestone.dueDate,
      order: milestone.order
    }));
    safeProject.tasks = safeProject.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignee: task.assignee ? { id: task.assignee.id, name: task.assignee.name } : null
    }));
    safeProject.feedback = safeProject.feedback.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt
    }));
  }

  return {
    project: safeProject,
    role,
    generatedAt: new Date().toISOString(),
  };
};

const buildLocalSummary = (context) => {
  const project = context.project;
  if (!project) {
    return {
      summary: 'Project data is not available for AI analysis.',
      keyPoints: [],
      risks: [],
      recommendations: [],
      nextActions: []
    };
  }

  const tasks = Array.isArray(project.tasks) ? project.tasks : [];
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
  const activeTasks = tasks.filter((task) => task.status !== 'COMPLETED');
  const overdueTasks = activeTasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date());
  const openFeedback = (project.feedback || []).filter((item) => !['RESOLVED', 'REJECTED'].includes(item.status));
  const milestones = project.milestones || [];
  const incompleteMilestones = milestones.filter((milestone) => milestone.status !== 'COMPLETED');
  const recentActivity = project.activities || [];

  const summary = `Project status: ${project.name || 'Project'} (${project.status || 'UNKNOWN'}); ${completedTasks} of ${tasks.length || 0} tasks are complete. ${overdueTasks.length} tasks are overdue, ${openFeedback.length} feedback items remain open, and ${incompleteMilestones.length} milestones are not yet completed.`;

  const keyPoints = [
    `${project.name || 'Project'} is currently ${project.status || 'unknown'} and is receiving active project management attention.`,
    `${completedTasks} tasks are complete, while ${Math.max((tasks.length || 0) - completedTasks, 0)} remain active or pending.`,
    `${openFeedback.length} feedback item${openFeedback.length === 1 ? '' : 's'} are still open for follow-up.`
  ];

  const risks = [
    overdueTasks.length > 0 ? `Potential delay risk: ${overdueTasks.length} task${overdueTasks.length === 1 ? '' : 's'} are overdue.` : 'No overdue task risk detected from the current project data.',
    incompleteMilestones.length > 0 ? `Milestone tracking indicates ${incompleteMilestones.length} milestone${incompleteMilestones.length === 1 ? '' : 's'} still in progress or upcoming.` : 'Milestone health looks stable based on the current milestone state.'
  ];

  const recommendations = [
    overdueTasks.length > 0 ? 'Prioritize overdue tasks to reduce delivery risk and set a focused recovery plan.' : 'Maintain the current pace and keep milestones aligned with the schedule.',
    openFeedback.length > 0 ? 'Review open feedback and decide which items need PM follow-up before the next milestone review.' : 'No immediate escalation is necessary based on current client feedback.',
    recentActivity.length > 0 ? 'Confirm the latest project activity has been reviewed and decisions are clearly assigned.' : 'Keep project activity updates visible to support clarity for stakeholders.'
  ];

  const nextActions = [
    overdueTasks.length > 0 ? `Address the earliest overdue task${overdueTasks.length === 1 ? '' : 's'} first.` : 'Continue with the current planned workstream.',
    openFeedback.length > 0 ? 'Follow up on the newest open feedback item.' : 'Keep the feedback queue monitored and documented.',
    'Review upcoming milestones and confirm any dependency or deadline risk before the next status update.'
  ];

  return {
    summary,
    keyPoints,
    risks,
    recommendations,
    nextActions
  };
};

const parseProviderResponse = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload);
      return parsed;
    } catch (error) {
      return { summary: payload, keyPoints: [], risks: [], recommendations: [], nextActions: [] };
    }
  }

  if (typeof payload === 'object') {
    if (payload.summary || payload.answer || payload.keyPoints || payload.risks || payload.recommendations || payload.nextActions) {
      return payload;
    }

    if (Array.isArray(payload.choices) && payload.choices[0]?.message?.content) {
      return parseProviderResponse(payload.choices[0].message.content);
    }
  }

  return null;
};

const callProvider = async ({ prompt, mode = 'summary' }) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const apiKey = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const endpoint = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(provider === 'openrouter' ? { 'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000', 'X-Title': process.env.APP_NAME || 'AppZex' } : {}),
      },
      body: JSON.stringify({
        model: provider === 'openrouter' ? (process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free') : (process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'You are an analytical project assistant for a SaaS project management application. Base your answer only on the project data supplied. Clearly label AI-generated interpretation and never present speculation as fact. Return a compact JSON object with summary, keyPoints, risks, recommendations, and nextActions fields.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI provider request failed with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = parseProviderResponse(data);

    if (!parsed || (!parsed.summary && !parsed.answer)) {
      throw new Error('Invalid AI response format');
    }

    if (mode === 'question') {
      return {
        answer: parsed.answer || parsed.summary || 'No answer generated from the available project context.',
        summary: parsed.summary || parsed.answer || 'AI summary unavailable.',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        risks: Array.isArray(parsed.risks) ? parsed.risks : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : []
      };
    }

    return {
      summary: parsed.summary || parsed.answer || 'AI summary unavailable.',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions : []
    };
  } catch (error) {
    console.warn('AI provider unavailable, falling back to local heuristics:', error.message);
    return null;
  }
};

const buildProjectPrompt = (context, mode = 'summary', question = null) => {
  const payload = JSON.stringify({
    project: context.project,
    mode,
    question,
    constraints: {
      scope: 'Use only authorized project data and clearly label interpretation as AI-generated insight.',
      noDestructiveActions: true,
      factVsInterpretation: 'Distinguish facts from recommendations.'
    }
  }, null, 2);

  return `Use the following project data to ${mode === 'question' ? 'answer the question' : 'generate a project summary'} without inventing facts. ${question ? `Question: ${question}` : ''}\n\n${payload}`;
};

const normalizeMeetingActionItem = (item) => {
  if (!item) return null;

  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed ? { title: trimmed, description: '', assignee: '', deadline: '' } : null;
  }

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const description = typeof item.description === 'string' ? item.description.trim() : '';
  const assignee = typeof item.assignee === 'string' ? item.assignee.trim() : (typeof item.owner === 'string' ? item.owner.trim() : '');
  const deadline = typeof item.deadline === 'string' ? item.deadline.trim() : (typeof item.dueDate === 'string' ? item.dueDate.trim() : '');

  if (!title) return null;

  return {
    title,
    description,
    assignee,
    deadline
  };
};

const normalizeMeetingSummaryResponse = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const safeSummary = typeof payload.summary === 'string' ? payload.summary.trim() : (
    typeof payload.meetingSummary === 'string' ? payload.meetingSummary.trim() : ''
  );

  const decisions = Array.isArray(payload.decisions) ? payload.decisions.map((decision) => String(decision).trim()).filter(Boolean) : [];
  const rawActionItems = Array.isArray(payload.actionItems) ? payload.actionItems : (
    Array.isArray(payload.actions) ? payload.actions : []
  );
  const deadlines = Array.isArray(payload.deadlines) ? payload.deadlines.map((deadline) => String(deadline).trim()).filter(Boolean) : [];

  const actionItems = rawActionItems
    .map(normalizeMeetingActionItem)
    .filter(Boolean)
    .slice(0, 25);

  if (!safeSummary && !decisions.length && !actionItems.length && !deadlines.length) {
    return null;
  }

  return {
    summary: safeSummary || 'Meeting summary generated successfully.',
    decisions,
    actionItems,
    deadlines
  };
};

const buildMeetingPrompt = (context) => {
  const payload = JSON.stringify({
    meeting: context.meeting,
    project: context.project,
    constraints: {
      scope: 'Use only the meeting and project context provided. Do not invent attendees, owners, tasks, or deadlines.',
      noSecrets: true,
      useOnlyVisibleNotes: context.role === 'CLIENT' ? 'Only client-visible meeting data may be used.' : 'Agency-visible meeting data may be used.',
      outputSchema: {
        summary: 'string',
        decisions: ['string'],
        actionItems: [{ title: 'string', description: 'string', assignee: 'string', deadline: 'string' }],
        deadlines: ['string']
      }
    }
  }, null, 2);

  return `Summarize this meeting using only the authorized context below. Do not invent facts or attributes. Return valid JSON with summary, decisions, actionItems, and deadlines only.\n\n${payload}`;
};

const buildLocalMeetingSummary = (context) => {
  const meeting = context.meeting;
  const project = context.project;

  if (!meeting || (!meeting.description && !meeting.title)) {
    return {
      summary: 'This meeting does not contain enough notes to generate an AI summary.',
      decisions: [],
      actionItems: [],
      deadlines: []
    };
  }

  const noteText = String(meeting.description || '').trim();
  const projectName = project?.name || 'this project';
  const meetingDate = meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : 'an upcoming date';
  const summary = noteText
    ? `Meeting summary for ${meeting.title || projectName}: This meeting reviewed progress for ${projectName} on ${meetingDate}. Key discussion points included: ${noteText.slice(0, 240)}${noteText.length > 240 ? '...' : ''}`
    : `Meeting summary for ${meeting.title || projectName}: The meeting reviewed ${projectName} progress on ${meetingDate}. Additional notes were not available for an expanded summary.`;

  const decisions = [];
  const actionItems = [];
  const deadlines = [];

  const noteLines = noteText.split(/\n|\.|\!|\?/).map((part) => part.trim()).filter(Boolean);
  noteLines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.includes('decision') || lower.includes('decided') || lower.includes('agreed')) {
      decisions.push(line);
    }
    if (lower.includes('action') || lower.includes('next step') || lower.includes('follow-up')) {
      actionItems.push({
        title: line.length > 80 ? `${line.slice(0, 77)}...` : line,
        description: line,
        assignee: '',
        deadline: ''
      });
    }
    const dateMatches = line.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
    if (dateMatches) {
      deadlines.push(dateMatches[0]);
    }
  });

  return {
    summary,
    decisions: decisions.slice(0, 8),
    actionItems: actionItems.slice(0, 8),
    deadlines: [...new Set(deadlines)].slice(0, 8)
  };
};

const callStructuredProvider = async ({ prompt, schemaName = 'meeting-summary' }) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const apiKey = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const endpoint = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(provider === 'openrouter' ? { 'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000', 'X-Title': process.env.APP_NAME || 'AppZex' } : {})
      },
      body: JSON.stringify({
        model: provider === 'openrouter' ? (process.env.OPENROUTER_MODEL || process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free') : (process.env.OPENAI_MODEL || 'gpt-4o-mini'),
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `You are an AI project meeting summarizer for a SaaS operations platform. Use only the authorized meeting context supplied. Return only valid JSON with fields summary, decisions, actionItems, and deadlines. If information is uncertain, leave fields empty or empty arrays rather than inventing data.`
          },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`AI provider request failed with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = parseProviderResponse(data);
    const normalized = normalizeMeetingSummaryResponse(parsed || {});

    if (!normalized && schemaName === 'meeting-summary') {
      throw new Error('Invalid AI response format');
    }

    return normalized || { summary: 'AI summary generated successfully.', decisions: [], actionItems: [], deadlines: [] };
  } catch (error) {
    console.warn('AI meeting summary unavailable, falling back to local heuristics:', error.message);
    return null;
  }
};

const projectAiService = {
  async generateSummary({ project, role = 'AGENCY_ADMIN' }) {
    const context = buildProjectContext({ project, role });
    const localResult = buildLocalSummary(context);
    const providerResult = await callProvider({
      prompt: buildProjectPrompt(context, 'summary', null),
      mode: 'summary'
    });

    const resolution = providerResult || localResult;
    return {
      summary: resolution.summary || localResult.summary,
      keyPoints: Array.isArray(resolution.keyPoints) ? resolution.keyPoints : localResult.keyPoints,
      risks: Array.isArray(resolution.risks) ? resolution.risks : localResult.risks,
      recommendations: Array.isArray(resolution.recommendations) ? resolution.recommendations : localResult.recommendations,
      nextActions: Array.isArray(resolution.nextActions) ? resolution.nextActions : localResult.nextActions,
      context,
      source: providerResult ? 'provider' : 'local'
    };
  },

  async generateInsights({ project, role = 'AGENCY_ADMIN' }) {
    const context = buildProjectContext({ project, role });
    const localSummary = buildLocalSummary(context);
    const providerResult = await callProvider({
      prompt: buildProjectPrompt(context, 'summary', 'Identify potential delays, workload risks, and prioritized next actions.'),
      mode: 'summary'
    });

    const resolved = providerResult || localSummary;
    return {
      insights: {
        summary: resolved.summary || localSummary.summary,
        keyPoints: Array.isArray(resolved.keyPoints) ? resolved.keyPoints : localSummary.keyPoints,
        risks: Array.isArray(resolved.risks) ? resolved.risks : localSummary.risks,
        recommendations: Array.isArray(resolved.recommendations) ? resolved.recommendations : localSummary.recommendations,
        nextActions: Array.isArray(resolved.nextActions) ? resolved.nextActions : localSummary.nextActions,
      },
      context,
      source: providerResult ? 'provider' : 'local'
    };
  },

  async answerQuestion({ project, role = 'AGENCY_ADMIN', question }) {
    const context = buildProjectContext({ project, role });
    const localSummary = buildLocalSummary(context);
    const prompt = buildProjectPrompt(context, 'question', question);
    const providerResult = await callProvider({ prompt, mode: 'question' });

    if (providerResult && providerResult.answer) {
      return {
        answer: providerResult.answer,
        summary: providerResult.summary || localSummary.summary,
        keyPoints: Array.isArray(providerResult.keyPoints) ? providerResult.keyPoints : localSummary.keyPoints,
        risks: Array.isArray(providerResult.risks) ? providerResult.risks : localSummary.risks,
        recommendations: Array.isArray(providerResult.recommendations) ? providerResult.recommendations : localSummary.recommendations,
        nextActions: Array.isArray(providerResult.nextActions) ? providerResult.nextActions : localSummary.nextActions,
        context,
        source: 'provider'
      };
    }

    const questionLower = String(question || '').toLowerCase();
    const projectStatus = context.project?.status || 'unknown';
    const overdue = (context.project?.tasks || []).filter((task) => task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date()).length;
    const openFeedback = (context.project?.feedback || []).filter((item) => !['RESOLVED', 'REJECTED'].includes(item.status)).length;

    let answer = `The current project status is ${projectStatus}. ${overdue} task(s) are overdue and ${openFeedback} feedback item(s) remain open, so project management attention should focus on recovery planning and client follow-up.`;
    if (questionLower.includes('block') || questionLower.includes('risk')) {
      answer = overdue > 0
        ? `The most likely blockers are overdue work and unresolved follow-up items. ${overdue} task(s) are overdue, and ${openFeedback} feedback item(s) remain open.`
        : 'No major blocker is visible from the current project data. The main focus should be keeping milestones and stakeholder communication on track.';
    } else if (questionLower.includes('overdue')) {
      answer = overdue > 0 ? `There are ${overdue} overdue task(s) in the project timeline.` : 'There are no overdue tasks at the moment.';
    } else if (questionLower.includes('milestone') || questionLower.includes('deadline')) {
      answer = `Milestones and due dates should be reviewed against the latest project activity. ${ (context.project?.milestones || []).filter((item) => item.status !== 'COMPLETED').length } milestone(s) are still active or upcoming.`;
    } else if (questionLower.includes('feedback')) {
      answer = openFeedback > 0 ? `Open feedback currently requires attention: ${openFeedback} item(s) remain unresolved.` : 'There is no open client feedback requiring immediate attention.';
    }

    return {
      answer,
      summary: localSummary.summary,
      keyPoints: localSummary.keyPoints,
      risks: localSummary.risks,
      recommendations: localSummary.recommendations,
      nextActions: localSummary.nextActions,
      context,
      source: 'local'
    };
  },

  async generateMeetingSummary({ meeting, project, role = 'AGENCY_ADMIN' }) {
    const context = {
      meeting: meeting ? stripSecrets(meeting) : null,
      project: project ? stripSecrets(project) : null,
      role
    };

    if (!context.meeting) {
      return {
        summary: 'This meeting does not contain enough notes to generate an AI summary.',
        decisions: [],
        actionItems: [],
        deadlines: [],
        source: 'local',
        context
      };
    }

    const prompt = buildMeetingPrompt(context);
    const providerResult = await callStructuredProvider({ prompt, schemaName: 'meeting-summary' });
    const localResult = buildLocalMeetingSummary(context);
    const resolved = providerResult || localResult;

    return {
      summary: resolved.summary || localResult.summary,
      decisions: Array.isArray(resolved.decisions) ? resolved.decisions : localResult.decisions,
      actionItems: Array.isArray(resolved.actionItems) ? resolved.actionItems.map(normalizeMeetingActionItem).filter(Boolean) : localResult.actionItems,
      deadlines: Array.isArray(resolved.deadlines) ? resolved.deadlines.filter((value) => typeof value === 'string' && value.trim()) : localResult.deadlines,
      source: providerResult ? 'provider' : 'local',
      context
    };
  },

  async createTaskFromActionItem({ project, meeting, actionItem, agencyId, creatorId, assigneeId = null, dueDate = null }) {
    if (!project || !actionItem || !actionItem.title) {
      throw new Error('Invalid AI action item');
    }

    const title = String(actionItem.title).trim();
    const description = actionItem.description ? String(actionItem.description).trim() : '';
    const normalizedDate = dueDate || actionItem.deadline || null;
    const assignee = Number(assigneeId);

    if (!title) {
      throw new Error('Action item title is required');
    }

    if (assigneeId !== null && assigneeId !== undefined && (!Number.isInteger(assignee) || assignee <= 0)) {
      throw new Error('Invalid assignee');
    }

    if (normalizedDate && Number.isNaN(new Date(normalizedDate).getTime())) {
      throw new Error('Invalid deadline');
    }

    return {
      title,
      description,
      projectId: Number(project.id),
      agencyId: Number(agencyId),
      assigneeId: assigneeId === null || assigneeId === undefined ? null : assignee,
      dueDate: normalizedDate ? new Date(normalizedDate) : null,
      status: 'TODO',
      priority: 'MEDIUM',
      meetingId: meeting ? Number(meeting.id) : null,
      createdBy: creatorId ? Number(creatorId) : null,
      source: 'ai_action_item'
    };
  }
};

module.exports = { projectAiService, buildProjectContext, buildLocalSummary, buildLocalMeetingSummary, stripSecrets, normalizeMeetingSummaryResponse };
