import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { Users, Briefcase, CheckSquare, Building, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/agencies/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data || {});
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-200">{error}</div>
      </AdminLayout>
    );
  }

  const { stats: s, chartData = [], recentActivity = [] } = stats || {};
  
  // Custom colors for the bar chart
  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ef4444'];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Overview</h1>
          <p className="text-gray-500 mt-1">Super Admin global statistics and activity.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Agencies</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-3xl font-bold text-gray-900">{s?.agencies?.total ?? 0}</p>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s?.agencies?.active ?? 0} Active</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Building size={24} /></div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{s?.users?.total ?? 0}</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={24} /></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Projects</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{s?.projects?.total ?? 0}</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase size={24} /></div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tasks</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{s?.tasks?.total ?? 0}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><CheckSquare size={24} /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Projects by Status</h2>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 13 }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Platform Activity</h2>
            </div>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((act) => (
                  <div key={act.id} className="flex gap-4">
                    <div className="relative flex-none">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${act.type === 'AGENCY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {act.type === 'AGENCY' ? <Building size={18} /> : <Users size={18} />}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{act.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(act.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-10">No recent activity found.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
