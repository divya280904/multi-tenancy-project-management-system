import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function ProtectedLayout({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (allowedRoles && !allowedRoles.includes(user?.role)) {
        // Redirect to their default dashboard if they don't have access
        switch (user?.role) {
          case 'SUPER_ADMIN':
            router.replace('/admin');
            break;
          case 'AGENCY_ADMIN':
          case 'AGENCY_TEAM':
            router.replace('/agency');
            break;
          case 'CLIENT':
            router.replace('/client-portal');
            break;
          default:
            router.replace('/login');
        }
      }
    }
  }, [isAuthenticated, loading, user, allowedRoles, router]);

  if (loading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-xl text-blue-600">AppZex</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name} ({user?.role})
          </span>
          <NotificationBell />
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Logout
          </button>
        </div>
      </nav>
      <main className="p-8">
        {children}
      </main>
    </div>
  );
}
