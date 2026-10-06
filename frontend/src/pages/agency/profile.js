import { useState, useEffect } from 'react';
import axios from 'axios';
import AgencyLayout from '../../../components/Layout/AgencyLayout';
import { useAuth } from '../../../context/AuthContext';

export default function AgencyProfile() {
  const [agency, setAgency] = useState(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/agency/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAgency(res.data.agency);
        setName(res.data.agency.name);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [API_URL]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/agency/profile`, { name }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgency(res.data.agency);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AgencyLayout><p>Loading...</p></AgencyLayout>;

  return (
    <AgencyLayout>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Agency Profile</h2>
        
        {message && (
          <div className={`p-4 mb-4 rounded ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={user?.role !== 'AGENCY_ADMIN'}
              className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:text-gray-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="w-full p-2 border rounded-md bg-gray-50 text-gray-700">
              {agency?.status}
            </div>
          </div>

          {user?.role === 'AGENCY_ADMIN' && (
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>
    </AgencyLayout>
  );
}
