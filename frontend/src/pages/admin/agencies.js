import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { useAuth } from '../../../context/AuthContext';
import { Search, MoreVertical, Play, Power, PowerOff } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AgencyManagement() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { login } = useAuth(); // or we can handle it directly via localStorage
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/agencies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAgencies(response.data.agencies || []);
    } catch (err) {
      console.error('Error fetching agencies:', err);
      setError('Unable to load agencies.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    const action = currentStatus === 'ACTIVE' ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this agency?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/admin/agencies/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAgencies();
    } catch (err) {
      alert(`Failed to ${action} agency.`);
    }
  };

  const handleImpersonate = async (id, name) => {
    if (!confirm(`Enter Support Mode for ${name}? You will view the platform as this agency's admin.`)) return;
    setImpersonating(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/admin/agencies/${id}/impersonate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Save original token
        localStorage.setItem('superAdminToken', token);
        // Replace current token with impersonation token
        localStorage.setItem('token', response.data.token);
        
        // Reload page to re-initialize context and redirect to agency dashboard
        window.location.href = '/agency';
      }
    } catch (err) {
      alert('Failed to enter support mode. ' + (err.response?.data?.message || ''));
      setImpersonating(false);
    }
  };

  const filteredAgencies = agencies.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agency Management</h1>
            <p className="text-gray-600 mt-1">View and manage all tenant agencies.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading agencies...</td></tr>
                ) : filteredAgencies.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No agencies found.</td></tr>
                ) : (
                  filteredAgencies.map((agency) => (
                    <tr key={agency.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                        <div className="text-sm text-gray-500">ID: {agency.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${agency.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {agency.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agency.userCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(agency.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleImpersonate(agency.id, agency.name)}
                            disabled={agency.status === 'SUSPENDED' || impersonating}
                            title="Support Mode (Impersonate)"
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 disabled:opacity-50"
                          >
                            <Play size={18} />
                          </button>
                          
                          {agency.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleSuspend(agency.id, 'ACTIVE')}
                              title="Suspend Agency"
                              className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50"
                            >
                              <PowerOff size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(agency.id, 'SUSPENDED')}
                              title="Activate Agency"
                              className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50"
                            >
                              <Power size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
