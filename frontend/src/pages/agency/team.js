import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AgencyLayout from '../../../components/Layout/AgencyLayout';
import { useAuth } from '../../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const formatRole = (role) => {
  if (role === 'AGENCY_ADMIN') return 'Agency Admin';
  if (role === 'AGENCY_TEAM') return 'Agency Team';
  return role;
};

const formatDate = (dateValue) => {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function AgencyTeam() {
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'AGENCY_TEAM' });
  const [message, setMessage] = useState('');
  const { user } = useAuth();

  const fetchTeam = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await axios.get(`${API_URL}/agency/team?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeam(res.data.team || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeam();
  }, [fetchTeam]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/agency/team`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Team member added successfully.');
      setFormData({ name: '', email: '', role: 'AGENCY_TEAM' });
      setShowAddForm(false);
      fetchTeam();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding member');
    }
  };

  const updateMemberStatus = async (memberId, nextStatus) => {
    const confirmMessage = nextStatus === 'SUSPENDED'
      ? 'Are you sure you want to suspend this team member?'
      : 'Are you sure you want to activate this team member?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/agency/team/${memberId}/status`, { status: nextStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating team member status');
    }
  };

  const handleDeactivateMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to deactivate this team member?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/team/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeam();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deactivating team member');
    }
  };

  if (isLoading) return <AgencyLayout><p>Loading...</p></AgencyLayout>;

  return (
    <AgencyLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-600">Manage your agency team members.</p>
        </div>
        {user?.role === 'AGENCY_ADMIN' && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Team Member
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded-md ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {showAddForm && user?.role === 'AGENCY_ADMIN' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add Team Member</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="AGENCY_TEAM">Agency Team</option>
                <option value="AGENCY_ADMIN">Agency Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team members..."
            className="p-2 border border-gray-300 rounded-md"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="ALL">All roles</option>
            <option value="AGENCY_ADMIN">Agency Admin</option>
            <option value="AGENCY_TEAM">Agency Team</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              {user?.role === 'AGENCY_ADMIN' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {team.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatRole(member.role)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(member.createdAt)}</td>
                {user?.role === 'AGENCY_ADMIN' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.id !== user.id && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => updateMemberStatus(member.id, member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {member.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeactivateMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {team.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'AGENCY_ADMIN' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                  No team members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AgencyLayout>
  );
}
