import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AgencyLayout from '../../../../components/Layout/AgencyLayout';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

export default function AgencyClients() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  
  // Forms state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  const [formData, setFormData] = useState({ companyName: '', primaryContact: '', email: '', phone: '', notes: '' });
  const [message, setMessage] = useState('');
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchClients = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, limit: 100 } // Keeping it simple for now without manual pagination
      });
      setClients(res.data.clients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClients();
  }, [fetchClients]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const openAddForm = () => {
    setFormData({ companyName: '', primaryContact: '', email: '', phone: '', notes: '' });
    setEditingClient(null);
    setShowAddForm(true);
    setMessage('');
  };

  const openEditForm = (client) => {
    setFormData({ 
      companyName: client.companyName || '', 
      primaryContact: client.primaryContact || '', 
      email: client.email || '', 
      phone: client.phone || '', 
      notes: client.notes || '' 
    });
    setEditingClient(client);
    setShowAddForm(true);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (editingClient) {
        await axios.patch(`${API_URL}/agency/clients/${editingClient.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Client updated successfully!');
      } else {
        await axios.post(`${API_URL}/agency/clients`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Client created successfully!');
      }
      setShowAddForm(false);
      fetchClients();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving client');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this client?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/agency/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchClients();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting client');
    }
  };

  if (isLoading) return <AgencyLayout><p>Loading...</p></AgencyLayout>;

  return (
    <AgencyLayout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold">Clients</h2>
        
        <div className="flex space-x-4 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={handleSearchChange}
            className="p-2 border rounded-md w-full md:w-64"
          />
          {user?.role === 'AGENCY_ADMIN' && !showAddForm && (
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
            >
              + New Client
            </button>
          )}
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
            <h3 className="text-lg font-semibold">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Company Name *"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="p-2 border rounded-md"
              required
            />
            <input
              type="text"
              placeholder="Primary Contact"
              value={formData.primaryContact}
              onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
              className="p-2 border rounded-md"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="p-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="p-2 border rounded-md"
            />
            <div className="md:col-span-2">
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="p-2 border rounded-md w-full h-24"
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                {editingClient ? 'Save Changes' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              {user?.role === 'AGENCY_ADMIN' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{client.companyName}</div>
                  {client.status === 'INACTIVE' && <span className="text-xs text-red-500">Deactivated</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.primaryContact || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(client.createdAt).toLocaleDateString()}
                </td>
                {user?.role === 'AGENCY_ADMIN' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/agency/clients/${client.id}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </Link>
                    <button onClick={() => openEditForm(client)} className="text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={user?.role === 'AGENCY_ADMIN' ? 6 : 5} className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-lg mb-2">No clients yet</p>
                  {user?.role === 'AGENCY_ADMIN' && (
                    <button onClick={openAddForm} className="text-blue-600 hover:underline">
                      Create your first client
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
