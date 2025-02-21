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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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
        const zipCode = localStorage.getItem('userZipCode') || '10001'; // Default to NYC if not set
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
    <div className={`h-screen flex overflow-hidden ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div 
        className={`
          ${isSidebarOpen ? 'w-64' : 'w-20'} 
          ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-30
          flex flex-col
          ${isMobile && !isSidebarOpen ? '-translate-x-full' : ''}
          ${isMobile && isSidebarOpen ? 'w-64 shadow-lg' : ''}
        `}
      >
        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={toggleSidebar}
          />
        )}
  
        {/* Sidebar Header */}
        <div className={`
          flex items-center justify-between h-16 
          ${darkMode ? 'border-gray-700' : 'border-gray-200'} 
          border-b px-4
        `}>
          {isSidebarOpen ? (
            <>
              <span className="text-xl font-bold">WeatherCrew</span>
              <button onClick={toggleSidebar} className="p-1 rounded-md focus:outline-none">
                {isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
              </button>
            </>
          ) : (
            <button 
              onClick={toggleSidebar} 
              className="p-1 mx-auto rounded-md focus:outline-none"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
  
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center p-2 rounded-md
                      ${isActive 
                        ? darkMode 
                          ? 'bg-blue-700 text-white' 
                          : 'bg-blue-50 text-blue-700'
                        : darkMode
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-100'
                      }
                      ${isSidebarOpen ? 'justify-start' : 'justify-center'}
                      transition-colors duration-200
                    `}
                  >
                    <div className="relative">
                      {item.icon}
                      {item.premium && (
                        <span className="flex h-2 w-2 absolute -top-1 -right-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                      )}
                    </div>
                    {isSidebarOpen && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
  
        {/* User Profile */}
        <div className={`
          p-4 border-t
          ${darkMode ? 'border-gray-700' : 'border-gray-200'}
        `}>
          {isSidebarOpen ? (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-9 w-9 rounded-full"
                  src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                  alt="User avatar"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <button
                  onClick={signOut}
                  className={`text-xs ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button className="p-1 rounded-full">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                  alt="User avatar"
                />
              </button>
            </div>
          )}
        </div>
      </div>
  
      {/* Main Content */}
      <div className={`
        flex-1
        ${isSidebarOpen ? 'ml-64' : 'ml-20'}
        ${isMobile ? 'ml-0' : ''}
        transition-all duration-300 ease-in-out
        flex flex-col
      `}>
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
              >
                <Menu size={20} />
              </button>
            )}
            
            <h1 className="text-xl font-semibold hidden sm:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
          </div>
  
          <div className="flex items-center space-x-4">
            {weatherData && location.pathname === '/dashboard' && (
              <div className="hidden md:flex items-center mr-4">
                <Cloud className={weatherData.isRainy ? 'text-blue-500' : 'text-yellow-500'} size={20} />
                <span className="ml-2">{weatherData.temperature}°F, {weatherData.condition}</span>
              </div>
            )}
            
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative`}>
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </header>
  
        {/* Page Content - Replace children with Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;