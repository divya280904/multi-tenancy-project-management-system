import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import AgencyLayout from '../../../../components/Layout/AgencyLayout';
import Link from 'next/link';
import { useAuth } from '../../../../context/AuthContext';
import { getTaskDueState } from '../../../../utils/taskStatus';

const emptyMilestoneForm = {
  name: '',
  status: 'PLANNED',
  dueDate: '',
  order: 0
};

const emptyTaskForm = {
  title: '',
  description: '',
  milestoneId: '',
  assigneeId: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: ''
};

export default function AgencyProjectDetail() {
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [activity, setActivity] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [files, setFiles] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ title: '', description: '', type: 'FEEDBACK', priority: 'MEDIUM' });
  const [aiSummary, setAiSummary] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [meetingSummaries, setMeetingSummaries] = useState({});
  const [meetingAiLoading, setMeetingAiLoading] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [milestoneForm, setMilestoneForm] = useState(emptyMilestoneForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [milestoneEditingId, setMilestoneEditingId] = useState(null);
  const [taskEditingId, setTaskEditingId] = useState(null);
  const [taskFilters, setTaskFilters] = useState({ status: '', priority: '', assigneeId: '', milestoneId: '', search: '' });

  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const isAdmin = user?.role === 'AGENCY_ADMIN';

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchProject = useCallback(async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching project details');
    }
  }, [id, API_URL]);

  const fetchMilestones = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/projects/${id}/milestones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMilestones(res.data.milestones || []);
    } catch (err) {
      console.error('Error fetching milestones', err);
    }
  }, [API_URL, id]);

  const fetchTasks = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/projects/${id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: taskFilters.status || undefined,
          priority: taskFilters.priority || undefined,
          assigneeId: taskFilters.assigneeId || undefined,
          milestoneId: taskFilters.milestoneId || undefined,
          search: taskFilters.search || undefined
        }
      });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks', err);
    }
  }, [API_URL, id, taskFilters]);

  const fetchMeetings = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/projects/${id}/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error('Error fetching meetings', err);
    }
  }, [API_URL, id]);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/projects/${id}/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivity(res.data.activities || []);
    } catch (err) {
      console.error('Error fetching activity', err);
    }
  }, [API_URL, id]);

  const fetchFeedback = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { projectId: id }
      });
      setFeedback(res.data.feedback || []);
    } catch (err) {
      console.error('Error fetching project feedback', err);
    }
  }, [API_URL, id]);

  const fetchFiles = useCallback(async () => {
    if (!id) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/agency/projects/${id}/files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data.files || []);
    } catch (err) {
      console.error('Error fetching files', err);
    }
  }, [API_URL, id]);

  const fetchTeam = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(res.data.team || []);
    } catch (err) {
      console.error('Error fetching team', err);
    }
  }, [API_URL]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setIsLoading(true);
      await Promise.all([fetchProject(), fetchMilestones(), fetchTasks(), fetchTeam(), fetchMeetings(), fetchActivity(), fetchFeedback(), fetchFiles()]);
      setIsLoading(false);
    };

    load();
  }, [fetchMilestones, fetchProject, fetchTasks, fetchTeam, fetchFiles, id]);

  const resetMilestoneForm = () => {
    setMilestoneForm(emptyMilestoneForm);
    setMilestoneEditingId(null);
    setShowMilestoneForm(false);
  };

  const resetTaskForm = () => {
    setTaskForm(emptyTaskForm);
    setTaskEditingId(null);
    setShowTaskForm(false);
  };

  const handleFeedbackStatusUpdate = async (feedbackId, nextStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/agency/feedback/${feedbackId}`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFeedback();
      fetchActivity();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update feedback status');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setFileUploading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/agency/projects/${id}/files`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchFiles();
      fetchActivity();
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setFileUploading(false);
      event.target.value = '';
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('Delete this file permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/projects/${id}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFiles();
      fetchActivity();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting file');
    }
  };

  const handleMilestoneSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...milestoneForm,
        order: Number(milestoneForm.order || 0)
      };

      if (milestoneEditingId) {
        await axios.patch(`${API_URL}/agency/milestones/${milestoneEditingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/agency/projects/${id}/milestones`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      resetMilestoneForm();
      fetchMilestones();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save milestone');
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...taskForm,
        milestoneId: taskForm.milestoneId || null,
        assigneeId: taskForm.assigneeId || null,
        dueDate: taskForm.dueDate || null
      };

      if (taskEditingId) {
        await axios.patch(`${API_URL}/agency/tasks/${taskEditingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/agency/projects/${id}/tasks`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      resetTaskForm();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save task');
    }
  };

  const handleMilestoneDelete = async (milestoneId) => {
    if (!confirm('Remove this milestone and detach its tasks from it?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/milestones/${milestoneId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMilestones();
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete milestone');
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete task');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'PLANNING': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'ON_HOLD': 'bg-gray-100 text-gray-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'PLANNED': 'bg-blue-100 text-blue-800',
      'TODO': 'bg-slate-100 text-slate-800',
      'IN_PROGRESS_TASK': 'bg-yellow-100 text-yellow-800'
    };
    return <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status?.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority) => {
    const map = {
      'LOW': 'text-green-600',
      'MEDIUM': 'text-blue-600',
      'HIGH': 'text-red-600 font-bold'
    };
    return <span className={`text-sm ${map[priority] || 'text-gray-500'}`}>{priority}</span>;
  };

  const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';

  const handleAiSummary = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/projects/${id}/ai-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate AI summary');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiInsights = async () => {
    if (!id) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/projects/${id}/ai-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiInsights(res.data.insights || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate AI insights');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiQuestion = async () => {
    if (!id || !aiQuestion.trim()) return;
    setAiLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/agency/projects/${id}/ai-ask`, { question: aiQuestion }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiAnswer(res.data.answer || 'No answer generated.');
      setAiQuestion('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to ask AI');
    } finally {
      setAiLoading(false);
    }
  };

  const handleMeetingAiSummary = async (meeting) => {
    if (!meeting || !id) return;
    setMeetingAiLoading((current) => ({ ...current, [meeting.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/projects/${id}/meetings/${meeting.id}/ai-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetingSummaries((current) => ({ ...current, [meeting.id]: res.data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to generate meeting summary');
    } finally {
      setMeetingAiLoading((current) => ({ ...current, [meeting.id]: false }));
    }
  };

  const handleCreateMeetingActionTasks = async (meeting) => {
    const summary = meetingSummaries[meeting.id];
    if (!summary || !summary.actionItems?.length) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/agency/projects/${id}/meetings/${meeting.id}/ai-action-items`, { actionItems: summary.actionItems }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTasks();
      setError('');
      alert('AI action items were created as project tasks.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create tasks from action items');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = !taskFilters.status || task.status === taskFilters.status;
    const matchesPriority = !taskFilters.priority || task.priority === taskFilters.priority;
    const matchesAssignee = !taskFilters.assigneeId || String(task.assigneeId) === String(taskFilters.assigneeId);
    const matchesMilestone = !taskFilters.milestoneId || String(task.milestoneId ?? '') === String(taskFilters.milestoneId);
    const searchText = (task.title || '').toLowerCase();
    const matchesSearch = !taskFilters.search || searchText.includes(taskFilters.search.toLowerCase());
    return matchesStatus && matchesPriority && matchesAssignee && matchesMilestone && matchesSearch;
  });

  const milestoneOptions = milestones.map((milestone) => ({
    id: milestone.id,
    name: milestone.name
  }));

  const teamOptions = team.filter((member) => member.role !== 'CLIENT');

  if (isLoading) return <AgencyLayout><p>Loading project details...</p></AgencyLayout>;

  if (error || !project) {
    return (
      <AgencyLayout>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error || 'Project not found'}
        </div>
        <div className="mt-4">
          <Link href="/agency/projects" className="text-blue-600 hover:underline">
            &larr; Back to Projects
          </Link>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="mb-6">
        <Link href="/agency/projects" className="text-gray-500 hover:text-gray-900 flex items-center mb-4">
          <span className="mr-2">&larr;</span> Back to Projects
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">{project.name}</h2>
            <div className="flex items-center space-x-4">
              {getStatusBadge(project.status)}
              <span className="text-gray-500">|</span>
              <span className="font-medium">Priority: {getPriorityBadge(project.priority)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Client</p>
                <p className="mt-1 text-gray-900 font-medium">{project.client ? project.client.companyName : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Project Manager</p>
                <p className="mt-1 text-gray-900">{project.manager?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Start Date</p>
                <p className="mt-1 text-gray-900">{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Expected Completion</p>
                <p className="mt-1 text-gray-900">{project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : '-'}</p>
              </div>
              <div className="md:col-span-2 mt-2">
                <p className="text-sm text-gray-500 font-medium">Description</p>
                <div className="mt-1 text-gray-900 bg-gray-50 p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold">Milestones</h3>
              {isAdmin && (
                <button onClick={() => { setShowMilestoneForm(true); setMilestoneEditingId(null); setMilestoneForm(emptyMilestoneForm); }} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  + New Milestone
                </button>
              )}
            </div>

            {showMilestoneForm && (
              <form onSubmit={handleMilestoneSubmit} className="mb-4 border rounded-md p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={milestoneForm.name} onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })} placeholder="Name *" className="p-2 border rounded-md md:col-span-2" required />
                  <select value={milestoneForm.status} onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })} className="p-2 border rounded-md">
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <input type="date" value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })} className="p-2 border rounded-md" />
                  <input type="number" min="0" value={milestoneForm.order} onChange={(e) => setMilestoneForm({ ...milestoneForm, order: e.target.value })} className="p-2 border rounded-md" />
                </div>
                <div className="mt-3 flex justify-end space-x-2">
                  <button type="button" onClick={resetMilestoneForm} className="px-3 py-2 border rounded-md">Cancel</button>
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">{milestoneEditingId ? 'Update Milestone' : 'Create Milestone'}</button>
                </div>
              </form>
            )}

            {milestones.length === 0 ? (
              <div className="py-10 text-center text-gray-500 border-dashed border rounded-md bg-gray-50">
                <p className="font-medium">No milestones yet</p>
                {isAdmin && <button onClick={() => setShowMilestoneForm(true)} className="mt-3 text-blue-600 underline">Add milestone</button>}
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-md p-4 flex justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{milestone.name}</span>
                        {getStatusBadge(milestone.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-x-3">
                        <span>Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : '—'}</span>
                        <span>Order: {milestone.order}</span>
                        <span>Tasks: {milestone.taskCount ?? 0}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => { setShowMilestoneForm(true); setMilestoneEditingId(milestone.id); setMilestoneForm({ name: milestone.name, status: milestone.status, dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '', order: milestone.order }); }} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => handleMilestoneDelete(milestone.id)} className="text-red-600 hover:underline">Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold">Tasks</h3>
              {isAdmin && (
                <button onClick={() => { setShowTaskForm(true); setTaskEditingId(null); setTaskForm(emptyTaskForm); }} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                  + New Task
                </button>
              )}
            </div>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-2">
              <input value={taskFilters.search} onChange={(e) => setTaskFilters({ ...taskFilters, search: e.target.value })} placeholder="Search title" className="p-2 border rounded-md" />
              <select value={taskFilters.status} onChange={(e) => setTaskFilters({ ...taskFilters, status: e.target.value })} className="p-2 border rounded-md">
                <option value="">All Statuses</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={taskFilters.priority} onChange={(e) => setTaskFilters({ ...taskFilters, priority: e.target.value })} className="p-2 border rounded-md">
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <select value={taskFilters.assigneeId} onChange={(e) => setTaskFilters({ ...taskFilters, assigneeId: e.target.value })} className="p-2 border rounded-md">
                <option value="">All Assignees</option>
                {teamOptions.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
              <select value={taskFilters.milestoneId} onChange={(e) => setTaskFilters({ ...taskFilters, milestoneId: e.target.value })} className="p-2 border rounded-md">
                <option value="">All Milestones</option>
                {milestoneOptions.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>

            {showTaskForm && (
              <form onSubmit={handleTaskSubmit} className="mb-4 border rounded-md p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Title *" className="p-2 border rounded-md md:col-span-2" required />
                  <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Description" className="p-2 border rounded-md md:col-span-2" rows="3" />
                  <select value={taskForm.milestoneId} onChange={(e) => setTaskForm({ ...taskForm, milestoneId: e.target.value })} className="p-2 border rounded-md">
                    <option value="">No milestone</option>
                    {milestones.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>{milestone.name}</option>
                    ))}
                  </select>
                  <select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })} className="p-2 border rounded-md">
                    <option value="">Unassigned</option>
                    {teamOptions.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="p-2 border rounded-md">
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} className="p-2 border rounded-md">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="p-2 border rounded-md" />
                </div>
                <div className="mt-3 flex justify-end space-x-2">
                  <button type="button" onClick={resetTaskForm} className="px-3 py-2 border rounded-md">Cancel</button>
                  <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-md">{taskEditingId ? 'Update Task' : 'Create Task'}</button>
                </div>
              </form>
            )}

            {filteredTasks.length === 0 ? (
              <div className="py-10 text-center text-gray-500 border-dashed border rounded-md bg-gray-50">
                <p className="font-medium">No tasks match the current view.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="border rounded-md p-4">
                    <div className="flex justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{task.title}</span>
                          {getTaskDueState(task) !== 'normal' && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTaskDueState(task) === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {getTaskDueState(task) === 'overdue' ? 'Overdue' : 'Due soon'}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>{task.milestone ? `Milestone: ${task.milestone.name}` : 'Milestone: —'}</span>
                          <span>{task.assignee ? `Assignee: ${task.assignee.name}` : 'Assignee: Unassigned'}</span>
                          <span className="flex items-center gap-1">Priority: {task.priority ? getPriorityBadge(task.priority) : '—'}</span>
                          <span className="flex items-center gap-1">Status: {task.status ? getStatusBadge(task.status) : '—'}</span>
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 text-sm">
                          <button onClick={() => { setShowTaskForm(true); setTaskEditingId(task.id); setTaskForm({ title: task.title, description: task.description || '', milestoneId: task.milestoneId || '', assigneeId: task.assigneeId || '', status: task.status || 'TODO', priority: task.priority || 'MEDIUM', dueDate: task.dueDate ? task.dueDate.split('T')[0] : '' }); }} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleTaskDelete(task.id)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">AI Project Assistant</h3>
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
                {(aiInsights.recommendations || []).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase text-gray-700">Recommendations</p>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {aiInsights.recommendations.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border rounded-md p-3 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ask AI about this project</label>
              <textarea value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} placeholder="What is blocking this project?" className="w-full border rounded-md p-2" rows="3" />
              <div className="mt-2 flex justify-end">
                <button onClick={handleAiQuestion} disabled={aiLoading || !aiQuestion.trim()} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">Ask AI</button>
              </div>
              {aiAnswer && (
                <div className="mt-3 rounded-md bg-white p-3 border text-sm text-gray-700">{aiAnswer}</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Meetings</h3>
            {meetings.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="mb-2 text-3xl">🗓️</p>
                <p className="text-sm">No meetings scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetings.slice(0, 5).map((meeting) => (
                  <div key={meeting.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{meeting.title}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{meeting.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{formatDate(meeting.meetingDate)}</p>
                    <p className="mt-1 text-xs text-gray-500">{meeting.meetingType} · {meeting.location || 'Remote'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => handleMeetingAiSummary(meeting)} disabled={meetingAiLoading[meeting.id]} className="text-xs px-2 py-1 border border-indigo-600 text-indigo-700 rounded-md disabled:opacity-50">
                        {meetingAiLoading[meeting.id] ? 'Generating...' : 'AI Summary'}
                      </button>
                      {meetingSummaries[meeting.id]?.actionItems?.length > 0 && (
                        <button onClick={() => handleCreateMeetingActionTasks(meeting)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-md">
                          Create Tasks
                        </button>
                      )}
                    </div>
                    {meetingSummaries[meeting.id] && (
                      <div className="mt-3 rounded-md bg-indigo-50 p-3 text-sm text-gray-700">
                        <p className="font-semibold text-indigo-800 mb-2">Meeting summary</p>
                        <p className="whitespace-pre-wrap">{meetingSummaries[meeting.id].summary}</p>
                        {meetingSummaries[meeting.id].decisions?.length > 0 && (
                          <ul className="mt-2 list-disc pl-5">
                            {meetingSummaries[meeting.id].decisions.map((decision, index) => <li key={`${meeting.id}-decision-${index}`}>{decision}</li>)}
                          </ul>
                        )}
                        {meetingSummaries[meeting.id].actionItems?.length > 0 && (
                          <div className="mt-2">
                            <p className="font-medium text-indigo-900">Action items</p>
                            <ul className="list-disc pl-5">
                              {meetingSummaries[meeting.id].actionItems.map((item, index) => <li key={`${meeting.id}-action-${index}`}>{item.title}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Client Feedback</h3>
            {feedback.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="mb-2 text-3xl">💬</p>
                <p className="text-sm">No feedback submitted for this project yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.slice(0, 6).map((item) => (
                  <div key={item.id} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <span className="text-[10px] uppercase tracking-wide bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{item.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{item.type} · {item.priority} priority</p>
                    <p className="mt-2 text-sm text-gray-700">{item.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleFeedbackStatusUpdate(item.id, e.target.value)}
                        className="p-1.5 border border-gray-300 rounded-md text-xs"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Activity Timeline</h3>
            {activity.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="mb-2 text-3xl">📈</p>
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-sm font-medium text-gray-900">{item.activityType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold">Project Files</h3>
              <div>
                <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={fileUploading} />
                <label htmlFor="file-upload" className="cursor-pointer px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors">
                  {fileUploading ? 'Uploading...' : 'Upload File'}
                </label>
              </div>
            </div>
            {files.length === 0 ? (
              <div className="py-6 text-center text-gray-500">
                <p className="text-sm">No files uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-md p-3 flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
                    <div className="overflow-hidden">
                      <p className="font-medium text-sm text-gray-900 truncate" title={file.originalName}>{file.originalName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{(file.fileSize / 1024 / 1024).toFixed(2)} MB · {new Date(file.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => {
                        const token = localStorage.getItem('token');
                        window.open(`${API_URL}/agency/projects/${id}/files/${file.id}/download?token=${token}`, '_blank');
                      }} className="text-xs text-blue-600 hover:underline">Download</button>
                      <button onClick={() => handleFileDelete(file.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
