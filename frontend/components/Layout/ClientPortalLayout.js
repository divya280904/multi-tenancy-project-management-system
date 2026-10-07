import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedLayout from './ProtectedLayout';
import { LayoutDashboard, Briefcase, Calendar, FileText, MessageSquare } from 'lucide-react';

export default function ClientPortalLayout({ children }) {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/client-portal', icon: <LayoutDashboard size={20} /> },
    { name: 'Projects', path: '/client-portal/projects', icon: <Briefcase size={20} /> },
  ];

  return (
    <ProtectedLayout allowedRoles={['CLIENT']}>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        <div className="w-full md:w-64 bg-white border-r">
          <nav className="p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
              Client Portal
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

            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-gray-50 text-gray-400 opacity-70">
                <Calendar size={20} /> Meetings <span className="text-xs ml-auto">(Soon)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-gray-50 text-gray-400 opacity-70">
                <FileText size={20} /> Files <span className="text-xs ml-auto">(Soon)</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-md bg-gray-50 text-gray-400 opacity-70">
                <MessageSquare size={20} /> Feedback <span className="text-xs ml-auto">(Soon)</span>
              </div>
            </div>
          </nav>
        </div>

        <div className="flex-1 p-4 md:p-8 bg-gray-50 overflow-auto w-full">
          {children}
        </div>
      </div>
    </ProtectedLayout>
  );
}
