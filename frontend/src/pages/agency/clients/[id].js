import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import AgencyLayout from '../../../../components/Layout/AgencyLayout';
import Link from 'next/link';

export default function AgencyClientDetail() {
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { id } = router.query;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchClient = useCallback(async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/agency/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClient(res.data.client);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching client details');
    } finally {
      setIsLoading(false);
    }
  }, [id, API_URL]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClient();
  }, [fetchClient]);

  if (isLoading) return <AgencyLayout><p>Loading client details...</p></AgencyLayout>;

  if (error || !client) {
    return (
      <AgencyLayout>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error || 'Client not found'}
        </div>
        <div className="mt-4">
          <Link href="/agency/clients" className="text-blue-600 hover:underline">
            &larr; Back to Clients
          </Link>
        </div>
      </AgencyLayout>
    );
  }

  return (
    <AgencyLayout>
      <div className="mb-6">
        <Link href="/agency/clients" className="text-gray-500 hover:text-gray-900 flex items-center mb-4">
          <span className="mr-2">&larr;</span> Back to Clients
        </Link>
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">{client.companyName}</h2>
          {client.status === 'INACTIVE' && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              Deactivated
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-gray-500 font-medium">Primary Contact</p>
                <p className="mt-1 text-gray-900">{client.primaryContact || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Email Address</p>
                <p className="mt-1 text-gray-900">
                  {client.email ? <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">{client.email}</a> : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                <p className="mt-1 text-gray-900">{client.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Date Added</p>
                <p className="mt-1 text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="md:col-span-2 mt-2">
                <p className="text-sm text-gray-500 font-medium">Notes</p>
                <div className="mt-1 text-gray-900 bg-gray-50 p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {client.notes || 'No notes provided.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 border-b pb-2">Projects</h3>
            <div className="py-8 text-center text-gray-500">
              <p className="mb-2 text-4xl">🏗️</p>
              <p className="font-medium">Projects Coming Soon</p>
              <p className="text-sm mt-1">Project functionality will be added in the next feature update.</p>
            </div>
          </div>
        </div>
      </div>
    </AgencyLayout>
  );
}
