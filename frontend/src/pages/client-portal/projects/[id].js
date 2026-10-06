import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import ClientPortalLayout from '../../../../components/Layout/ClientPortalLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ClientProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ title: '', description: '', type: 'FEEDBACK', priority: 'MEDIUM' });
  const [aiSummary, setAiSummary] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [meetingSummaries, setMeetingSummaries] = useState({});
  const [meetingAiLoading, setMeetingAiLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchProjectData = async () => {
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/client-portal/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data.project);

      const meetingsResponse = await axios.get(`${API_URL}/client-portal/meetings?projectId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(meetingsResponse.data.meetings || []);

      const activityResponse = await axios.get(`${API_URL}/client-portal/projects/${id}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(activityResponse.data.activities || []);

      const feedbackResponse = await axios.get(`${API_URL}/client-portal/projects/${id}/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedback(feedbackResponse.data.feedback || []);
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchProjectData();
  }, [id]);

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/client-portal/projects/${id}/feedback`, feedbackForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackForm({ title: '', description: '', type: 'FEEDBACK', priority: 'MEDIUM' });
      fetchProjectData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleAiSummary = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/client-portal/projects/${id}/ai-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSummary(response.data);
    } catch (error) {
      console.error('Error generating AI summary:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiInsights = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/client-portal/projects/${id}/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiInsights(response.data.insights || {});
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiQuestion = async () => {
    if (!id || !aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/client-portal/projects/${id}/ai-ask`, { question: aiQuestion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiAnswer(response.data.answer || 'No answer generated.');
      setAiQuestion('');
    } catch (error) {
      console.error('Error asking AI question:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleMeetingAiSummary = async (meeting) => {
    if (!id || !meeting) return;
    setMeetingAiLoading((current) => ({ ...current, [meeting.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/client-portal/projects/${id}/meetings/${meeting.id}/ai-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetingSummaries((current) => ({ ...current, [meeting.id]: response.data }));
    } catch (error) {
      console.error('Error generating meeting summary:', error);
    } finally {
      setMeetingAiLoading((current) => ({ ...current, [meeting.id]: false }));
    }
  };

  if (loading) {
    return (
      <ClientPortalLayout>
        <p>Loading project...</p>
      </ClientPortalLayout>
    );
  }

  if (!project) {
    return (
      <ClientPortalLayout>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Project not found</h1>
          <p className="text-gray-600 mt-2">The project could not be found for your client account.</p>
        </div>
      </ClientPortalLayout>
    );
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-600 mt-1">{project.description || 'No description provided.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-2 font-medium text-gray-900">{project.status}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Priority</p>
            <p className="mt-2 font-medium text-gray-900">{project.priority}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="mt-2 font-medium text-gray-900">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Expected Completion</p>
            <p className="mt-2 font-medium text-gray-900">
              {project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:col-span-2">
            <p className="text-sm text-gray-500">Project Manager</p>
            <p className="mt-2 font-medium text-gray-900">{project.manager?.name || 'Unassigned'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Milestones</h2>
            {project.milestones?.length ? (
              <div className="space-y-3">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900">{milestone.name}</h3>
                      <span className="text-xs text-gray-600">#{milestone.order}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Status: {milestone.status}</p>
                      <p>Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No milestones assigned to this project.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>
            {project.tasks?.length ? (
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <span className="text-xs bg-gray-100 rounded-full px-2 py-1 text-gray-700">{task.priority}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>Status: {task.status}</p>
                      <p>Assignee: {task.assignee?.name || 'Unassigned'}</p>
                      <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No tasks assigned to this project.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Project Assistant</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={handleAiSummary} className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Generate AI Summary</button>
            <button onClick={handleAiInsights} className="px-3 py-2 border border-indigo-600 text-indigo-700 rounded-md text-sm hover:bg-indigo-50">AI Insights</button>
          </div>

          {aiSummary && (
            <div className="mb-4 border rounded-md p-4 bg-indigo-50">
              <p className="text-sm font-semibold text-indigo-800 mb-2">AI Project Summary</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiSummary.summary}</p>
              {Array.isArray(aiSummary.keyPoints) && aiSummary.keyPoints.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
                  {aiSummary.keyPoints.map((point) => <li key={point}>{point}</li>)}
                </ul>
              )}
            </div>
          )}

          {aiInsights && (
            <div className="mb-4 border rounded-md p-4 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800 mb-2">AI-generated insight</p>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {(aiInsights.risks || []).map((risk) => <li key={risk}>{risk}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-4 border rounded-md p-3 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ask AI about this project</label>
            <textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="What should I watch for next?" className="w-full border rounded-md p-2" rows="3" />
            <div className="mt-2 flex justify-end">
              <button onClick={handleAiQuestion} disabled={aiLoading || !aiQuestion.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">Ask AI</button>
            </div>
            {aiAnswer && (
              <div className="mt-3 rounded-md bg-white p-3 border text-sm text-gray-700">{aiAnswer}</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Meetings</h2>
            {meetings.length ? (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">{meeting.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>{meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString() : '—'}</p>
                      <p>{meeting.meetingType} · {meeting.location || 'Remote'}</p>
                    </div>
                    <button onClick={() => handleMeetingAiSummary(meeting)} disabled={meetingAiLoading[meeting.id]} className="mt-3 text-xs px-2 py-1 border border-indigo-600 text-indigo-700 rounded-md disabled:opacity-50">
                      {meetingAiLoading[meeting.id] ? 'Generating...' : 'AI Summary'}
                    </button>
                    {meetingSummaries[meeting.id] && (
                      <div className="mt-3 rounded-md bg-indigo-50 p-3 text-sm text-gray-700">
                        <p className="font-semibold text-indigo-800 mb-2">Meeting summary</p>
                        <p className="whitespace-pre-wrap">{meetingSummaries[meeting.id].summary}</p>
                        {meetingSummaries[meeting.id].actionItems?.length > 0 && (
                          <ul className="mt-2 list-disc pl-5">
                            {meetingSummaries[meeting.id].actionItems.map((item, index) => <li key={`${meeting.id}-action-${index}`}>{item.title}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No meetings scheduled for this project.</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3 mb-5">
              <input
                type="text"
                value={feedbackForm.title}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })}
                placeholder="Title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
              <textarea
                value={feedbackForm.description}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                placeholder="Describe the issue, change request, or feedback"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select value={feedbackForm.type} onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2">
                  <option value="FEEDBACK">Feedback</option>
                  <option value="CHANGE_REQUEST">Change Request</option>
                  <option value="BUG">Bug</option>
                  <option value="QUESTION">Question</option>
                </select>
                <select value={feedbackForm.priority} onChange={(e) => setFeedbackForm({ ...feedbackForm, priority: e.target.value })} className="border border-gray-300 rounded-lg px-3 py-2">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Submit Feedback
              </button>
            </form>
            {feedback.length ? (
              <div className="space-y-3">
                {feedback.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">{item.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.type} · {item.priority} priority</p>
                    <p className="mt-2 text-sm text-gray-700">{item.description}</p>
                    {item.agencyResponse && (
                      <div className="mt-3 rounded-md bg-white p-2 text-sm text-gray-700 border">
                        <span className="font-medium">Agency response:</span> {item.agencyResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No feedback has been submitted yet.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Timeline</h2>
            {activity.length ? (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-sm font-medium text-gray-900">{item.activityType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No activity has been recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
