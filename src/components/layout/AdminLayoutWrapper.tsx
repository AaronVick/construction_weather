// src/components/layout/AdminLayoutWrapper.tsx
import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { useAdmin } from '../../contexts/AdminContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import LoadingScreen from '../ui/LoadingScreen';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

const AdminLayoutWrapper: React.FC<AdminLayoutWrapperProps> = ({ children }) => {
  const { user, signOut } = useFirebaseAuth();
  const { adminUser, isLoading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Auto-close sidebar on mobile
  React.useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        currentPath={location.pathname}
        user={adminUser || user}
        onToggle={toggleSidebar}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div 
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        {/* Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                  {isSidebarOpen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  )}
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-800">
                Admin Dashboard
              </h2>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <span className="mr-3 text-gray-700">
                    {adminUser?.firstName || user?.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutWrapper;
