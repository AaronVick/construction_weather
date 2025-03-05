// src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { Outlet } from 'react-router-dom';
import { db } from '../../lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { Moon, Sun, Bell, Menu, X, Home, Users, Briefcase, Cloud, Mail, Settings, MapPin, CreditCard, BarChart2 } from 'lucide-react';
import CollapsibleSidebar from './CollapsibleSidebar';

interface UserProfile {
  id: string;
  full_name?: string;
  email: string;
  avatar_url?: string | null;
  company?: string | null;
  job_title?: string | null;
  onboarding_completed?: boolean;
}

const DashboardLayout: React.FC = () => {
  // State Management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Hooks
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, signOut } = useFirebaseAuth();

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.uid) return;

      try {
        const userProfileRef = doc(db, 'user_profiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);

        if (userProfileSnap.exists()) {
          setUserProfile({
            id: userProfileSnap.id,
            ...userProfileSnap.data(),
            email: user.email || ''
          } as UserProfile);
        } else {
          // Create a basic profile if none exists
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            full_name: user.displayName || ''
          });
        }
      } catch (error) {
        console.error('Error in fetchUserProfile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.uid, user?.email, user?.displayName]);

  // Navigation items configuration
  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { name: 'Clients', icon: <Users size={20} />, path: '/clients' },
    { name: 'Jobsites', icon: <MapPin size={20} />, path: '/jobsites', premium: true },
    { name: 'Workers', icon: <Briefcase size={20} />, path: '/workers' },
    { name: 'Weather Automation', icon: <Cloud size={20} />, path: '/weather' },
    { name: 'Email Configuration', icon: <Mail size={20} />, path: '/email' },
    { name: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics', premium: true },
    { name: 'Subscription', icon: <CreditCard size={20} />, path: '/subscription' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' }
  ];

  // Sidebar auto-close on mobile
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Component */}
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        navItems={navItems}
        currentPath={window.location.pathname}
        user={{
          email: userProfile?.email || user?.email,
          user_metadata: {
            full_name: userProfile?.full_name,
            avatar_url: userProfile?.avatar_url || '/api/placeholder/40/40'
          }
        }}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main 
        className={`
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        `}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left section */}
            <div className="flex items-center">
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {userProfile?.company || 'Dashboard'}
              </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <Sun size={20} className="text-gray-500 dark:text-gray-400" />
                ) : (
                  <Moon size={20} className="text-gray-500 dark:text-gray-400" />
                )}
              </button>

              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
                aria-label="View notifications"
              >
                <Bell size={20} className="text-gray-500 dark:text-gray-400" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
