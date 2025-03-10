// src/components/layout/AdminSidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BarChart2,
  Settings,
  DollarSign,
  FileText,
  Bell,
  ShieldCheck,
  Mail,
  CloudLightning
} from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  currentPath: string;
  user: any;
  onToggle: () => void;
  onSignOut: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  isMobile,
  currentPath,
  user,
  onToggle,
  onSignOut
}) => {
  // Check if user has super admin privileges
  const isSuperAdmin = user?.role === 'admin' || user?.email === 'admin@example.com';
  
  // Admin navigation items
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'User Profiles', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Subscriptions', icon: <CreditCard size={20} />, path: '/admin/subscriptions' },
    { name: 'Billing', icon: <DollarSign size={20} />, path: '/admin/billing' },
    { name: 'Revenue', icon: <BarChart2 size={20} />, path: '/admin/revenue' },
    { name: 'Reports', icon: <FileText size={20} />, path: '/admin/reports' },
    { name: 'System Settings', icon: <Settings size={20} />, path: '/admin/settings' },
    // Testing tools - only visible to super admins
    ...(isSuperAdmin ? [
      { name: 'Email Testing', icon: <Mail size={20} />, path: '/admin/email-testing' },
      { name: 'Weather Testing', icon: <CloudLightning size={20} />, path: '/admin/weather-testing' }
    ] : [])
  ];
  
  console.log('Admin sidebar - user role:', user?.role, 'email:', user?.email, 'isSuperAdmin:', isSuperAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 
          flex flex-col
          bg-indigo-900 text-white
          transition-all duration-300 ease-in-out
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-indigo-800">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-semibold text-white">
                Admin Panel
              </span>
              {!isMobile && (
                <button 
                  onClick={onToggle}
                  className="p-2 rounded-lg hover:bg-indigo-800 
                    transition-colors duration-200"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-indigo-800 
                transition-colors duration-200 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 rounded-lg
                    transition-all duration-200
                    ${currentPath === item.path 
                      ? 'bg-indigo-700 text-white' 
                      : 'text-indigo-100 hover:bg-indigo-800'
                    }
                    ${isOpen ? '' : 'justify-center'}
                  `}
                >
                  <span className="flex items-center">
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User profile */}
        <div className="border-t border-indigo-800 p-4">
          {isOpen ? (
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white break-all">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-xs text-indigo-200">
                  {user?.role || 'Admin'}
                </p>
                <button
                  onClick={onSignOut}
                  className="text-xs text-indigo-300 hover:text-white 
                    transition-colors duration-200 mt-1"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-full bg-indigo-700 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
