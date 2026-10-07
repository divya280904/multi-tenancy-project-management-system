import Link from 'next/link';
import ProtectedLayout from './ProtectedLayout';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LayoutDashboard, Building2, Users, Contact, Briefcase } from 'lucide-react';

export default function AgencyLayout({ children }) {
  const router = useRouter();
  const { isImpersonating, exitImpersonation } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/agency', icon: <LayoutDashboard size={20} /> },
    { name: 'Agency Profile', path: '/agency/profile', icon: <Building2 size={20} /> },
    { name: 'Team Members', path: '/agency/team', icon: <Users size={20} /> },
    { name: 'Clients', path: '/agency/clients', icon: <Contact size={20} /> },
    { name: 'Projects', path: '/agency/projects', icon: <Briefcase size={20} /> },
  ];

  return (
    <ProtectedLayout allowedRoles={['AGENCY_ADMIN', 'AGENCY_TEAM']}>
      {isImpersonating && (
        <div className="bg-red-600 text-white px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm font-medium shadow-md text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="flex-shrink-0" />
            <span>Support Mode: You are viewing this workspace as a Super Admin.</span>
          </div>
          <button
            onClick={exitImpersonation}
            className="bg-white text-red-600 px-3 py-1.5 rounded hover:bg-red-50 transition-colors shadow-sm w-full sm:w-auto flex-shrink-0"
          >
            Exit Support Mode
          </button>
        </div>
      )}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* Agency Sidebar */}
        <div className="w-full md:w-64 bg-white border-r">
          <nav className="p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
              Agency Workspace
            </div>
            {navItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium shadow-[inset_4px_0_0_0_#2563eb]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 bg-gray-50 overflow-auto w-full">
          {children}
        </div>
      </div>
    </ProtectedLayout>
  );
}
