// src/components/layout/DashboardLayout.tsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Outlet } from 'react-router-dom';
import { Moon, Sun, Bell, Menu, X, Home, Users, Briefcase, Cloud, Mail, Settings, MapPin, CreditCard, BarChart2 } from 'lucide-react';
import CollapsibleSidebar from './CollapsibleSidebar';

// Since we're using Outlet, we don't need children prop anymore
const DashboardLayout: React.FC = () => {
  // Debug logging for initial render
  console.log('DashboardLayout initializing');

  // State Management
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [weatherData, setWeatherData] = useState(null);

  // Hooks
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Debug logging for state changes
  console.log('DashboardLayout state:', {
    isSidebarOpen,
    darkMode,
    isMobile,
    hasWeatherData: !!weatherData
  });

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
    console.log('Checking mobile view state:', isMobile);
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // Toggle sidebar handler
  const toggleSidebar = () => {
    console.log('Toggling sidebar');
    setIsSidebarOpen(!isSidebarOpen);
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
          email: "user@example.com",
          user_metadata: {
            avatar_url: "/api/placeholder/40/40"
          }
        }}
        onToggle={toggleSidebar}
        onSignOut={() => console.log('Sign out clicked')}
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
                  onClick={toggleSidebar}
                  className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
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

              {/* Notifications */}
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
          {/* Content wrapper with max width and auto margins */}
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;




/* before sidebar refractor */

// import React, { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { useTheme } from '../../hooks/useTheme';
// import { useMediaQuery } from '../../hooks/useMediaQuery';
// import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
// import { getCurrentWeather } from '../../services/weatherService';
// import { 
//   Home,
//   Users,
//   Briefcase,
//   Cloud,
//   Mail,
//   Settings,
//   Bell,
//   Menu,
//   X,
//   Moon,
//   Sun,
//   MapPin,
//   CreditCard,
//   BarChart2,
//   ChevronLeft,
//   ChevronRight
// } from 'lucide-react';
// import { Outlet } from 'react-router-dom';

// const DashboardLayout: React.FC = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [weatherData, setWeatherData] = useState<any>(null);
//   const location = useLocation();
//   const { darkMode, toggleDarkMode } = useTheme();
//   const isMobile = useMediaQuery('(max-width: 768px)');
//   const { user, signOut } = useSupabaseAuth();

//   useEffect(() => {
//     console.log('Checking mobile view...');
//     if (isMobile) {
//       console.log('Mobile view detected, closing sidebar.');
//       setIsSidebarOpen(false);
//     } else {
//       console.log('Desktop view detected, opening sidebar.');
//       setIsSidebarOpen(true);
//     }
//   }, [isMobile]);

//   useEffect(() => {
//     console.log('Fetching weather data...');
//     const fetchWeather = async () => {
//       try {
//         const zipCode = localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001';
//         console.log(`Fetching weather for zip code: ${zipCode}`);
//         const data = await getCurrentWeather(zipCode);
//         console.log('Weather data fetched:', data);
//         setWeatherData(data);
//       } catch (error) {
//         console.error('Failed to fetch weather data:', error);
//       }
//     };

//     if (location.pathname === '/dashboard') {
//       fetchWeather();
//     }
//   }, [location.pathname, user?.user_metadata?.zip_code]);

//   const navItems = [
//     { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
//     { name: 'Clients', icon: <Users size={20} />, path: '/clients' },
//     { 
//       name: 'Jobsites', 
//       icon: <MapPin size={20} />, 
//       path: '/jobsites',
//       premium: true 
//     },
//     { name: 'Workers', icon: <Briefcase size={20} />, path: '/workers' },
//     { name: 'Weather Automation', icon: <Cloud size={20} />, path: '/weather' },
//     { name: 'Email Configuration', icon: <Mail size={20} />, path: '/email' },
//     { 
//       name: 'Analytics', 
//       icon: <BarChart2 size={20} />, 
//       path: '/analytics',
//       premium: true 
//     },
//     { name: 'Subscription', icon: <CreditCard size={20} />, path: '/subscription' },
//     { name: 'Settings', icon: <Settings size={20} />, path: '/settings' }
//   ];

//   const toggleSidebar = () => {
//     console.log('Toggling sidebar...');
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   return (
//     <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
//       {/* Mobile Sidebar Overlay */}
//       {isMobile && isSidebarOpen && (
//         <div 
//           className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20"
//           onClick={toggleSidebar}
//           aria-hidden="true"
//         />
//       )}

//       {/* Sidebar */}
//       <div 
//         className={`
//           fixed inset-y-0 left-0 z-30
//           flex flex-col
//           bg-white dark:bg-gray-800
//           transition-all duration-300 ease-in-out
//           ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
//           ${isSidebarOpen ? 'w-64' : 'w-20'}
//           border-r border-gray-200 dark:border-gray-700
//         `}
//       >
//         {/* Sidebar Header */}
//         <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
//           {isSidebarOpen ? (
//             <>
//               <span className="text-xl font-bold text-gray-900 dark:text-white">WeatherCrew</span>
//               {!isMobile && (
//                 <button 
//                   onClick={toggleSidebar}
//                   className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
//                   aria-label="Collapse sidebar"
//                 >
//                   <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
//                 </button>
//               )}
//             </>
//           ) : (
//             <button 
//               onClick={toggleSidebar}
//               className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mx-auto"
//               aria-label="Expand sidebar"
//             >
//               <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
//             </button>
//           )}
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 overflow-y-auto py-4">
//           <ul className="space-y-1 px-3">
//             {navItems.map((item) => (
//               <li key={item.path}>
//                 <Link
//                   to={item.path}
//                   className={`
//                     flex items-center px-2 py-2 rounded-md
//                     ${location.pathname === item.path
//                       ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
//                       : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
//                     }
//                     ${isSidebarOpen ? '' : 'justify-center'}
//                     transition-colors duration-200
//                   `}
//                   aria-current={location.pathname === item.path ? 'page' : undefined}
//                 >
//                   <span className="flex items-center">
//                     {item.icon}
//                     {item.premium && (
//                       <span className="flex h-2 w-2 relative -mt-2 -mr-2">
//                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
//                         <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
//                       </span>
//                     )}
//                   </span>
//                   {isSidebarOpen && <span className="ml-3">{item.name}</span>}
//                 </Link>
//               </li>
//             ))}
//           </ul>
//         </nav>

//         {/* User Profile */}
//         <div className="border-t border-gray-200 dark:border-gray-700 p-4">
//           {isSidebarOpen ? (
//             <div className="flex items-center">
//               <img
//                 className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"
//                 src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
//                 alt="User avatar"
//               />
//               <div className="ml-3">
//                 <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
//                   {user?.user_metadata?.full_name || user?.email}
//                 </p>
//                 <button
//                   onClick={signOut}
//                   className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                 >
//                   Sign out
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="flex justify-center">
//               <img
//                 className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"
//                 src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
//                 alt="User avatar"
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Main Content */}
//       <div 
//         className={`
//           flex-1 flex flex-col
//           ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}
//           min-h-screen
//           transition-all duration-300
//         `}
//       >
//         {/* Top Navigation */}
//         <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center">
//             {/* Mobile menu button */}
//             {isMobile && (
//               <button
//                 onClick={toggleSidebar}
//                 className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
//                 aria-label="Toggle menu"
//               >
//                 {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
//               </button>
//             )}
            
//             <h1 className="text-xl font-semibold text-gray-900 dark:text-white hidden sm:block">
//               {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
//             </h1>
//           </div>
  
//           <div className="flex items-center space-x-4">
//             {weatherData && location.pathname === '/dashboard' && (
//               <div className="hidden md:flex items-center mr-4">
//                 <Cloud 
//                   className={weatherData.isRainy ? 'text-blue-500' : 'text-yellow-500'} 
//                   size={20} 
//                 />
//                 <span className="ml-2 text-gray-700 dark:text-gray-200">
//                   {weatherData.temperature}°F, {weatherData.condition}
//                 </span>
//               </div>
//             )}
            
//             <button
//               onClick={toggleDarkMode}
//               className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
//               aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
//             >
//               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
//             </button>
            
//             <button 
//               className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 relative"
//               aria-label="View notifications"
//             >
//               <Bell size={20} />
//               <span 
//                 className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"
//                 aria-hidden="true"
//               />
//             </button>
//           </div>
//         </header>

//         {/* Page Content */}
//         <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
//           <div className="py-6 px-4 sm:px-6 lg:px-8">
//             <Outlet />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;