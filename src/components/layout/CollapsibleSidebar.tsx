// src/components/layout/CollapsibleSidebar.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsibleSidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  navItems: Array<{
    name: string;
    icon: React.ReactNode;
    path: string;
    premium?: boolean;
  }>;
  currentPath: string;
  user: any; // Type this properly based on your user type
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
  console.log('CollapsibleSidebar rendering:', {
    isOpen,
    isMobile,
    currentPath,
    userEmail: user?.email
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
          onClick={() => {
            console.log('Mobile overlay clicked, closing sidebar');
            onToggle();
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-30
          flex flex-col
          bg-white dark:bg-gray-800
          transition-all duration-300 ease-in-out
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isOpen ? 'w-64' : 'w-20'}
          border-r border-gray-200 dark:border-gray-700
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen ? (
            <>
              <span className="text-xl font-bold text-gray-900 dark:text-white">WeatherCrew</span>
              {!isMobile && (
                <button 
                  onClick={() => {
                    console.log('Collapse sidebar button clicked');
                    onToggle();
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={() => {
                console.log('Expand sidebar button clicked');
                onToggle();
              }}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              console.log(`Rendering nav item: ${item.name}, current path match: ${currentPath === item.path}`);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center px-2 py-2 rounded-md
                      ${currentPath === item.path
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isOpen ? '' : 'justify-center'}
                      transition-colors duration-200
                    `}
                    aria-current={currentPath === item.path ? 'page' : undefined}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      {item.premium && (
                        <span className="flex h-2 w-2 relative -mt-2 -mr-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                        </span>
                      )}
                    </span>
                    {isOpen && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {isOpen ? (
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="User avatar"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <button
                  onClick={() => {
                    console.log('Sign out button clicked');
                    onSignOut();
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="User avatar"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CollapsibleSidebar;