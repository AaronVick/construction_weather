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
  console.log('Rendering CollapsibleSidebar:', { isOpen, isMobile, currentPath });

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      <div 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 
        shadow-lg transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        ${isOpen ? 'w-64' : 'w-20'}
      `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {isOpen ? (
            <>
              <span className="text-lg font-bold text-gray-900 dark:text-white">WeatherCrew</span>
              {!isMobile && (
                <button 
                  onClick={onToggle}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={onToggle}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 rounded-lg transition-all duration-200
                    ${currentPath === item.path ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}
                    ${isOpen ? '' : 'justify-center'}
                  `}
                >
                  {item.icon}
                  {isOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {isOpen ? (
            <div className="flex items-center">
              <img
                className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="User avatar"
              />
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.email}</p>
                <button
                  onClick={onSignOut}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"
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
