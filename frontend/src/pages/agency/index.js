import { useEffect, useState } from 'react';
import axios from 'axios';
import AgencyLayout from '../../../components/Layout/AgencyLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AgencyDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/agency/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboard(response.data.dashboard || {});
      } catch (err) {
        console.error('Error fetching agency dashboard:', err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const summary = dashboard?.summary || {};
  const projectStatus = dashboard?.projectStatus || [];
  const projects = dashboard?.projects || [];
  const meetings = dashboard?.meetings || [];
  const feedback = dashboard?.feedback || {};
  const team = dashboard?.team || [];
  const activity = dashboard?.activity || [];

  if (loading) {
    return (
      <AgencyLayout>
        <div className="bg-white rounded-lg shadow p-6">Loading dashboard...</div>
      </AgencyLayout>
    );
  }

  if (error) {
    return (
      <AgencyLayout>
        <div className="bg-white rounded-lg shadow p-6 text-red-600">{error}</div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency Dashboard</h1>
          <p className="text-gray-600">Operational performance across projects, team activity, and client delivery.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {[
            ['Active Projects', summary.totalActiveProjects ?? 0, 'text-blue-600'],
            ['Completed Projects', summary.totalCompletedProjects ?? 0, 'text-green-600'],
            ['Clients', summary.totalClients ?? 0, 'text-purple-600'],
            ['Team Members', summary.totalTeamMembers ?? 0, 'text-indigo-600'],
            ['Open Tasks', summary.openTasks ?? 0, 'text-orange-600'],
          ].map(([label, value, color]) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Project Status</h2>
            {projectStatus.length === 0 ? <p className="text-gray-500">No project status data yet.</p> : (
              <div className="space-y-3">
                {projectStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.status}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Task Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span>Overdue</span><span>{summary.overdueTasks ?? 0}</span></div>
              <div className="flex items-center justify-between"><span>Due Soon</span><span>{summary.tasksDueSoon ?? 0}</span></div>
              <div className="flex items-center justify-between"><span>Open</span><span>{summary.openTasks ?? 0}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Active Project Progress</h2>
            {projects.length === 0 ? <p className="text-gray-500">No active projects.</p> : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between text-sm mb-1"><span>{project.name}</span><span>{project.progress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Upcoming Meetings</h2>
            {meetings.length === 0 ? <p className="text-gray-500">No upcoming meetings.</p> : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-medium">{meeting.title}</p>
                    <p className="text-sm text-gray-600">{meeting.meetingDate} • {meeting.startTime} - {meeting.endTime}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Open Feedback</h2>
            {feedback?.recent?.length ? (
              <div className="space-y-3">
                {feedback.recent.slice(0, 5).map((item) => (
                  <div key={item.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.status} • {item.priority}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-500">No open requests.</p>}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Team Workload</h2>
            {team.length === 0 ? <p className="text-gray-500">No team assignments.</p> : (
              <div className="space-y-3">
                {team.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <span>{member.name}</span>
                    <span className="text-sm text-gray-600">{member.assignedOpenTasks} open</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          {activity.length === 0 ? <p className="text-gray-500">No recent activity.</p> : (
            <div className="space-y-3">
              {activity.slice(0, 6).map((item) => (
                <div key={item.id} className="border-b pb-2 last:border-b-0">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-gray-600">{item.project?.name || 'Project'} • {new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AgencyLayout>
  );
}
