import Link from 'next/link';
import ProtectedLayout from './ProtectedLayout';
import { useRouter } from 'next/router';
import { LayoutDashboard, Building2 } from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Agencies', path: '/admin/agencies', icon: <Building2 size={20} /> },
  ];

  return (
    <ProtectedLayout allowedRoles={['SUPER_ADMIN']}>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
        {/* Admin Sidebar */}
        <div className="w-full md:w-64 bg-white border-r">
          <nav className="p-4 space-y-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
              Platform Admin
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
