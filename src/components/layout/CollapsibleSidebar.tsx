// src/components/layout/CollapsibleSidebar.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  premium?: boolean;
}

interface CollapsibleSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  navItems: NavItem[];
  currentPath: string;
  user: any;
  onToggle: () => void;
  onSignOut: () => void;
}

const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  isMobile,
  navItems,
  currentPath,
  user,
  onToggle,
  onSignOut
}) => {
  // Debug logging
  console.log('CollapsibleSidebar render:', {
    isOpen,
    isMobile,
    currentPath,
    userEmail: user?.email
  });

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
          bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {isOpen ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                WeatherCrew
              </span>
              {!isMobile && (
                <button 
                  onClick={onToggle}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                    transition-colors duration-200"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          ) : (
            <button 
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 
                transition-colors duration-200 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              console.log('Rendering nav item:', item.name);
              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={`
                      flex items-center px-3 py-2 rounded-lg
                      transition-all duration-200
                      ${currentPath === item.path 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                      ${isOpen ? '' : 'justify-center'}
                      relative
                    `}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      {item.premium && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                        </span>
                      )}
                    </span>
                    {isOpen && (
                      <span className="ml-3 whitespace-nowrap">{item.name}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          {isOpen ? (
            <div className="flex items-center">
              <img
                className="h-10 w-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                src={user?.user_metadata?.avatar_url || '/api/placeholder/40/40'}
                alt="User avatar"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <button
                  onClick={onSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700 
                    dark:text-gray-400 dark:hover:text-gray-200
                    transition-colors duration-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                className="h-10 w-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                src={user?.user_metadata?.avatar_url || '/api/placeholder/40/40'}
                alt="User avatar"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default CollapsibleSidebar;