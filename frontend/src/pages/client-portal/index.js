import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ClientPortalLayout from '../../../components/Layout/ClientPortalLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ClientPortalDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/client-portal/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboard(response.data.dashboard || {});
      } catch (err) {
        console.error('Error fetching client dashboard:', err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const summary = dashboard?.summary || {};
  const projects = dashboard?.projects || [];
  const meetings = dashboard?.meetings || [];
  const files = dashboard?.files || [];
  const activity = dashboard?.activity || [];
  const feedback = dashboard?.feedback || {};

  if (loading) {
    return (
      <ClientPortalLayout>
        <p>Loading dashboard...</p>
      </ClientPortalLayout>
    );
  }

  if (error) {
    return (
      <ClientPortalLayout>
        <p className="text-red-600">{error}</p>
      </ClientPortalLayout>
    );
  }

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-gray-600">Delivery overview across your projects, meetings, and shared updates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Active Projects</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{summary.totalActiveProjects ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-green-600">{summary.totalCompletedProjects ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Upcoming Meetings</p>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{summary.upcomingMeetings ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Unread Notifications</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{summary.unreadNotifications ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Project Summary</h2>
            <Link href="/client-portal/projects" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
          </div>

          {projects.length === 0 ? (
            <p className="text-gray-500">No active projects available.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className="text-sm text-gray-600">{project.status}</span>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Progress: {project.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Meetings</h2>
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Open Requests</h2>
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Files</h2>
            {files.length === 0 ? <p className="text-gray-500">No recent shared files.</p> : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-gray-600">{file.project?.name} • {file.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {activity.length === 0 ? <p className="text-gray-500">No recent client-visible activity.</p> : (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="border-b pb-2 last:border-b-0">
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-600">{item.project?.name || 'Project'} • {new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  );
}
