// src/components/layout/DashboardLayout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getCurrentWeather } from '../../services/weatherService';
import { ChevronLeft } from "lucide-react";
import { Outlet } from 'react-router-dom';
// Icons
import {
  Home,
  Users,
  Briefcase,
  Cloud,
  Mail,
  Settings,
  Bell,
  Menu,
  X,
  Moon,
  Sun,
  MapPin,
  CreditCard,
  BarChart2,
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const DashboardLayout: React.FC = () => {  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { user, signOut } = useSupabaseAuth();

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  // Fetch current weather for the dashboard
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const zipCode = localStorage.getItem('userZipCode') || '10001';
        const data = await getCurrentWeather(zipCode);
        setWeatherData(data);
      } catch (error) {
        console.error('Failed to fetch weather data', error);
      }
    };

    if (location.pathname === '/dashboard') {
      fetchWeather();
    }
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { name: 'Clients', icon: <Users size={20} />, path: '/clients' },
    { 
      name: 'Jobsites', 
      icon: <MapPin size={20} />, 
      path: '/jobsites',
      premium: true 
    },
    { name: 'Workers', icon: <Briefcase size={20} />, path: '/workers' },
    { name: 'Weather Automation', icon: <Cloud size={20} />, path: '/weather' },
    { name: 'Email Configuration', icon: <Mail size={20} />, path: '/email' },
    { 
      name: 'Analytics', 
      icon: <BarChart2 size={20} />, 
      path: '/analytics',
      premium: true 
    },
    { name: 'Subscription', icon: <CreditCard size={20} />, path: '/subscription' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' }
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30
          transform transition-transform duration-300 ease-in-out
          ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          bg-white dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {isSidebarOpen ? (
            <>
              <span className="text-xl font-bold dark:text-white">WeatherCrew</span>
              {!isMobile && (
                <button 
                  onClick={toggleSidebar}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
            </>
          ) : (
            <button 
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Sidebar">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-2 py-2 rounded-md
                    ${location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                    ${isSidebarOpen ? '' : 'justify-center'}
                  `}
                  aria-current={location.pathname === item.path ? 'page' : undefined}
                >
                  <span className="flex items-center">
                    {item.icon}
                    {item.premium && (
                      <span className="flex h-2 w-2 relative -mt-2 -mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </span>
                    )}
                  </span>
                  {isSidebarOpen && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {isSidebarOpen ? (
            <div className="flex items-center">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="User avatar"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
                <button
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img
                className="h-8 w-8 rounded-full"
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="User avatar"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className={`
          flex-1 flex flex-col
          ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} 
          min-h-screen
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Top Navigation */}
        <header className={`
          h-16 flex items-center justify-between px-4 sm:px-6
          ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-200'}
          border-b
        `}>
          <div className="flex items-center">
            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className={`mr-4 p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            
            <h1 className="text-xl font-semibold hidden sm:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
  
          <div className="flex items-center space-x-4">
            {weatherData && location.pathname === '/dashboard' && (
              <div className="hidden md:flex items-center mr-4">
                <Cloud 
                  className={weatherData.isRainy ? 'text-blue-500' : 'text-yellow-500'} 
                  size={20} 
                  aria-hidden="true"
                />
                <span className="ml-2">{weatherData.temperature}°F, {weatherData.condition}</span>
              </div>
            )}
            
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button 
              className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative`}
              aria-label="View notifications"
            >
              <Bell size={20} />
              <span 
                className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;