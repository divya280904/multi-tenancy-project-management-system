import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AgencyLayout from '../../../../components/Layout/AgencyLayout';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

export default function AgencyProjects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [team, setTeam] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  
  const { user } = useAuth();
  
  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  const initialFormState = { 
    name: '', description: '', clientId: '', managerId: '', 
    startDate: '', expectedCompletionDate: '', status: 'PLANNING', priority: 'MEDIUM' 
  };
  const [formData, setFormData] = useState(initialFormState);
  const [message, setMessage] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status: statusFilter, priority: priorityFilter, clientId: clientFilter, limit: 100 }
      });
      setProjects(res.data.projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, search, statusFilter, priorityFilter, clientFilter]);

  const fetchDependencies = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [clientsRes, teamRes] = await Promise.all([
        axios.get(`${API_URL}/agency/clients`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/agency/team`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setClients(clientsRes.data.clients);
      setTeam(teamRes.data.team);
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDependencies();
  }, [fetchDependencies]);

  const openAddForm = () => {
    setFormData(initialFormState);
    setEditingProject(null);
    setShowAddForm(true);
    setMessage('');
  };

  const openEditForm = (project) => {
    setFormData({ 
      name: project.name || '', 
      description: project.description || '', 
      clientId: project.clientId || '', 
      managerId: project.managerId || '', 
      startDate: project.startDate ? project.startDate.split('T')[0] : '', 
      expectedCompletionDate: project.expectedCompletionDate ? project.expectedCompletionDate.split('T')[0] : '', 
      status: project.status || 'PLANNING', 
      priority: project.priority || 'MEDIUM' 
    });
    setEditingProject(project);
    setShowAddForm(true);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const submitData = { ...formData, managerId: formData.managerId || null };
      if (editingProject) {
        await axios.patch(`${API_URL}/agency/projects/${editingProject.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Project updated successfully!');
      } else {
        await axios.post(`${API_URL}/agency/projects`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Project created successfully!');
      }
      setShowAddForm(false);
      fetchProjects();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting project');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'PLANNING': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'ON_HOLD': 'bg-gray-100 text-gray-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status.replace('_', ' ')}</span>;
  };

  const getPriorityBadge = (priority) => {
    const map = {
      'LOW': 'text-gray-500',
      'MEDIUM': 'text-blue-500',
      'HIGH': 'text-red-500 font-bold',
    };
    return <span className={`text-sm ${map[priority] || 'text-gray-500'}`}>{priority}</span>;
  };

  if (isLoading) return <AgencyLayout><p>Loading projects...</p></AgencyLayout>;

  return (
    <AgencyLayout>
      <div className="flex flex-col mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Projects</h2>
          {user?.role === 'AGENCY_ADMIN' && !showAddForm && (
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + New Project
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="">All Statuses</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
          </select>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {showAddForm && user?.role === 'AGENCY_ADMIN' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{editingProject ? 'Edit Project' : 'Add New Project'}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Project Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="p-2 border rounded-md md:col-span-2"
              required
            />
            <div className="md:col-span-2">
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="p-2 border rounded-md w-full h-20"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Client *</label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="p-2 border rounded-md w-full"
                required
              >
                <option value="">Select a Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Project Manager</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="p-2 border rounded-md w-full"
              >
                <option value="">Select a Manager (Optional)</option>
                {team.filter(t => t.role !== 'SUPER_ADMIN' && t.role !== 'CLIENT').map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="p-2 border rounded-md w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Expected Completion *</label>
              <input
                type="date"
                value={formData.expectedCompletionDate}
                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                className="p-2 border rounded-md w-full"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="p-2 border rounded-md w-full"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="p-2 border rounded-md w-full"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
              {user?.role === 'AGENCY_ADMIN' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{project.name}</div>
                  <div>{getPriorityBadge(project.priority)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.client?.companyName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {project.manager?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getStatusBadge(project.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{new Date(project.startDate).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-400">to {new Date(project.expectedCompletionDate).toLocaleDateString()}</div>
                </td>
                {user?.role === 'AGENCY_ADMIN' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/agency/projects/${project.id}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </Link>
                    <button onClick={() => openEditForm(project)} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'AGENCY_ADMIN' ? 6 : 5} className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-lg mb-2">No projects found</p>
                  {user?.role === 'AGENCY_ADMIN' && (
                    <button onClick={openAddForm} className="text-blue-600 hover:underline">
                      Create a project
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AgencyLayout>
  );
}
