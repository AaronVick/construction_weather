// src/pages/dashboard/Dashboard.tsx


import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Users, Briefcase, Mail, Cloud, AlertTriangle, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  // Debug logging
  console.log('Dashboard component initializing');

  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    activeClients: 0,
    activeWorkers: 0,
    pendingEmails: 0,
    weatherAlerts: 0
  });

  // Simulated data fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setData({
          activeClients: 24,
          activeWorkers: 56,
          pendingEmails: 3,
          weatherAlerts: 2
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            {error}
          </h3>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Here's what's happening with your crews today
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Clients
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {data.activeClients}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Active Workers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Workers
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {data.activeWorkers}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Pending Emails */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Emails
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {data.pendingEmails}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Weather Alerts
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {data.weatherAlerts}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              data.weatherAlerts > 0 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <Cloud className={`w-6 h-6 ${
                data.weatherAlerts > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
          {data.weatherAlerts > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {data.weatherAlerts} active weather alerts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {/* Activity items would go here */}
            <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
          </div>
        </div>

        {/* Weather Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weather Overview
          </h2>
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300">
              Weather conditions are favorable for outdoor work
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weather Check Action */}
        <button 
          onClick={() => console.log('Weather check clicked')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Weather Check
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Run manual check
              </p>
            </div>
          </div>
        </button>

        {/* Send Notification Action */}
        <button 
          onClick={() => console.log('Send notification clicked')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Send Notification
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Email clients/crews
              </p>
            </div>
          </div>
        </button>

        {/* Manage Clients Action */}
        <button 
          onClick={() => console.log('Manage clients clicked')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Manage Clients
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add or update
              </p>
            </div>
          </div>
        </button>

        {/* View Reports Action */}
        <button 
          onClick={() => console.log('View reports clicked')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <BarChart2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                View Reports
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analytics & insights
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Activity Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Email Activity
          </h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Chart placeholder
          </div>
        </div>

        {/* Weather Forecast */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            5-Day Forecast
          </h2>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
                <div className="flex items-center">
                  <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">72°F</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Features Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Upgrade to Premium
            </h2>
            <p className="text-blue-100">
              Get access to advanced features and analytics
            </p>
          </div>
          <button 
            onClick={() => console.log('Upgrade clicked')}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






// testing simpler version to see where errors are
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useTheme } from '../../hooks/useTheme';
// import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
// import { useSubscription } from '../../hooks/useSubscription';
// import WeatherWidgetContainer from '../../components/weather/WeatherWidgetContainer';
// import { 
//   getActiveClients, 
//   getActiveWorkers, 
//   getPendingEmails,
//   getDashboardData 
// } from '../../services/dataService';

// // Components
// import Card from '../../components/ui/Card';
// import WeatherWidget from '../../components/weather/WeatherWidget';
// import InsightMetric from '../../components/dashboard/InsightMetric';
// import LineChart from '../../components/charts/LineChart';
// import RecentActivityList from '../../components/dashboard/RecentActivityList';
// import UpgradePrompt from '../../components/subscription/UpgradePrompt';

// // Icons
// import {
//   Users,
//   Briefcase,
//   Mail,
//   AlertTriangle,
//   Map,
//   Cloud,
//   TrendingUp,
//   Calendar,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react';

// // Component loading check utility
// const checkComponentLoad = (name: string) => {
//   try {
//     console.log(`✓ Successfully loaded: ${name}`);
//     return true;
//   } catch (err) {
//     console.error(`✗ Failed to load: ${name}`, err);
//     return false;
//   }
// };

// const Dashboard: React.FC = () => {
//   // Check hooks loading
//   console.log('--- Checking Hook Loading ---');
//   const theme = useTheme();
//   checkComponentLoad('useTheme');
  
//   const { user } = useSupabaseAuth();
//   checkComponentLoad('useSupabaseAuth');
  
//   const { subscription } = useSubscription();
//   checkComponentLoad('useSubscription');

//   const darkMode = theme ? theme.darkMode : false;

//   // Check component loading
//   console.log('--- Checking Component Loading ---');
//   const componentsLoaded = {
//     weatherWidget: checkComponentLoad('WeatherWidgetContainer'),
//     card: checkComponentLoad('Card'),
//     insightMetric: checkComponentLoad('InsightMetric'),
//     lineChart: checkComponentLoad('LineChart'),
//     recentActivity: checkComponentLoad('RecentActivityList'),
//     upgradePrompt: checkComponentLoad('UpgradePrompt')
//   };

//   // Initial service check
//   useEffect(() => {
//     const checkServices = async () => {
//       try {
//         console.log('Checking getDashboardData service...');
//         const response = await getDashboardData();
//         console.log('getDashboardData service check:', {
//           available: !!response,
//           response
//         });
//       } catch (e) {
//         console.error('getDashboardData service check error:', e);
//       }
//     };
//     checkServices();
//   }, []);

//   // Monitor component loading status
//   useEffect(() => {
//     console.log('Component loading status:', componentsLoaded);
//   }, []);

//   // State initialization
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [insights, setInsights] = useState<{
//     activeClients: number;
//     activeWorkers: number;
//     pendingEmails: number;
//     weatherAlerts: number;
//     jobsites: number;
//     monthlyEmails: Array<{
//       month: string;
//       count: number;
//     }>;
//   }>({
//     activeClients: 0,
//     activeWorkers: 0,
//     pendingEmails: 0,
//     weatherAlerts: 0,
//     jobsites: 0,
//     monthlyEmails: [],
//   });
  
//   const [recentActivity, setRecentActivity] = useState<Array<{
//     id: number;
//     type: string;
//     message: string;
//     timestamp: string;
//     status: string;
//   }>>([]);

//   // Log initial state
//   console.log('Initial state:', {
//     loading,
//     error,
//     insights,
//     recentActivity,
//     darkMode,
//     user: !!user,
//     subscription: subscription?.plan
//   });

  
// // Main data fetching effect
// useEffect(() => {
//   const fetchDashboardData = async () => {
//     console.log('Starting fetchDashboardData execution');
//     try {
//       setLoading(true);
//       console.log('Loading state set to true');
      
//       // Get user preferences
//       const zipCode = localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001';
//       console.log('Retrieved zip code for weather data:', zipCode);
      
//       // Fetch dashboard metrics
//       console.log('Initiating getDashboardData API call');
//       const { data, error } = await getDashboardData();
//       console.log('getDashboardData response received:', { 
//         hasData: !!data, 
//         hasError: !!error,
//         errorDetails: error
//       });
      
//       if (error) {
//         console.error('Error from getDashboardData:', error);
//         throw error;
//       }
      
//       if (!data) {
//         console.error('No data returned from getDashboardData');
//         throw new Error('No data available');
//       }
      
//       console.log('Processing dashboard data:', {
//         clientStats: data.clientStats,
//         workerStats: data.workerStats,
//         notificationStats: data.notificationStats,
//         jobsiteStats: data.jobsiteStats
//       });

//       // Update insights state
//       const newInsights = {
//         activeClients: data.clientStats.active,
//         activeWorkers: data.workerStats.active,
//         pendingEmails: data.notificationStats.last30Days,
//         weatherAlerts: data.jobsiteStats.withRecentAlerts,
//         jobsites: subscription.plan === 'basic' ? 1 : data.jobsiteStats.total,
//         monthlyEmails: data.weatherAlertMetrics
//       };
//       console.log('Setting new insights:', newInsights);
//       setInsights(newInsights);
      
//       console.log('Setting recent activity:', data.recentActivity);
//       setRecentActivity(data.recentActivity);
      
//     } catch (err: unknown) {
//       console.error('Detailed error in fetchDashboardData:', {
//         error: err,
//         message: err instanceof Error ? err.message : 'An unknown error occurred',
//         stack: err instanceof Error ? err.stack : undefined
//       });
//       setError('Failed to load dashboard data. Please try again.');
//     } finally {
//       console.log('Completing fetchDashboardData, setting loading to false');
//       setLoading(false);
//     }
//   };

//   fetchDashboardData();
// }, [user, subscription.plan]);


// // Helper functions with logging
// const countWeatherAlerts = (forecast: any[]) => {
//   console.log('Counting weather alerts from forecast data:', forecast);
//   const alertCount = forecast.filter(day => 
//     day.precipitation > 50 || 
//     day.windSpeed > 20 ||
//     day.temperature < 32 ||
//     day.snowfall > 1
//   ).length;
//   console.log('Weather alert count:', alertCount);
//   return alertCount;
// };

// const getJobsitesCount = async () => {
//   console.log('Fetching jobsites count');
//   // This would be implemented with actual data service
//   const count = 5;
//   console.log('Jobsites count:', count);
//   return count;
// };

// const getMonthlyEmailStats = async () => {
//   console.log('Fetching monthly email stats');
//   // Mock data for demonstration
//   const stats = [
//     { month: 'Jan', count: 12 },
//     { month: 'Feb', count: 8 },
//     { month: 'Mar', count: 15 },
//     { month: 'Apr', count: 22 },
//     { month: 'May', count: 18 },
//     { month: 'Jun', count: 10 }
//   ];
//   console.log('Monthly email stats:', stats);
//   return stats;
// };


// const getRecentActivity = async () => {
//   console.log('Fetching recent activity');
//   // Mock data for demonstration
//   const activity = [
//     { 
//       id: 1, 
//       type: 'email_sent',
//       message: 'Weather alert emails sent to 12 clients',
//       timestamp: '2025-02-18T08:30:00Z',
//       status: 'success'
//     },
//     { 
//       id: 2, 
//       type: 'weather_check',
//       message: 'Weather check completed: Heavy rain detected',
//       timestamp: '2025-02-18T05:00:00Z',
//       status: 'warning'
//     },
//     { 
//       id: 3, 
//       type: 'client_added',
//       message: 'New client "Acme Construction" added',
//       timestamp: '2025-02-17T14:15:00Z',
//       status: 'info'
//     },
//     { 
//       id: 4, 
//       type: 'worker_update',
//       message: 'Updated contact info for 3 workers',
//       timestamp: '2025-02-16T11:22:00Z',
//       status: 'info'
//     }
//   ];
//   console.log('Recent activity data:', activity);
//   return activity;
// };



// // Render section helpers with error boundaries
// const renderWeatherSection = () => {
//   try {
//     console.log('Attempting to render weather section');
//     return (
//       <WeatherWidgetContainer
//         zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
//         onWeatherUpdate={(weather) => {
//           console.log('Weather update received:', weather);
//           return (
//             weather?.current && (
//               <div className={`mt-4 p-4 rounded-lg ${
//                 weather.current.isRainy || weather.current.isSnowy 
//                   ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
//                   : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
//               }`}>
//                 <div className="flex items-center">
//                   {weather.current.isRainy || weather.current.isSnowy ? (
//                     <AlertTriangle size={20} className="text-red-500 dark:text-red-400 mr-2" />
//                   ) : (
//                     <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2" />
//                   )}
//                   <span className="font-medium">
//                     {weather.current.isRainy || weather.current.isSnowy 
//                       ? `Weather Alert: ${weather.current.condition} today. Consider notifying crews.`
//                       : `All clear: Weather conditions look good for outdoor work today.`
//                     }
//                   </span>
//                 </div>
//               </div>
//             )
//           );
//         }}
//       />
//     );
//   } catch (err) {
//     console.error('Weather section render error:', err);
//     return <div className="p-4 bg-red-50 text-red-700 rounded">Weather widget unavailable</div>;
//   }
// };

// const renderMetrics = () => {
//   try {
//     console.log('Attempting to render metrics section');
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <InsightMetric
//           title="Active Clients"
//           value={insights.activeClients}
//           icon={<Users size={24} />}
//           change={+8}
//           linkTo="/clients"
//           color="blue"
//         />
//         <InsightMetric
//           title="Active Workers"
//           value={insights.activeWorkers}
//           icon={<Briefcase size={24} />}
//           change={+2}
//           linkTo="/workers"
//           color="green"
//         />
//         <InsightMetric
//           title="Pending Emails"
//           value={insights.pendingEmails}
//           icon={<Mail size={24} />}
//           change={0}
//           linkTo="/email"
//           color="purple"
//         />
//         <InsightMetric
//           title="Weather Alerts"
//           value={insights.weatherAlerts}
//           icon={<Cloud size={24} />}
//           change={+1}
//           linkTo="/weather"
//           color={insights.weatherAlerts > 0 ? "red" : "green"}
//         />
//       </div>
//     );
//   } catch (err) {
//     console.error('Metrics section render error:', err);
//     return <div className="p-4 bg-red-50 text-red-700 rounded">Metrics unavailable</div>;
//   }
// };






// // Render loading state
// if (loading) {
//   console.log('Rendering loading state');
//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center p-4">
//       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
//       <div className="text-center">
//         <p className="text-lg font-medium mb-2">Loading your dashboard...</p>
//         <p className="text-sm text-gray-500">This may take a few moments</p>
//       </div>
//     </div>
//   );
// }

// // Render error state
// if (error) {
//   console.log('Rendering error state:', error);
//   return (
//     <div className="flex h-full flex-col items-center justify-center">
//       <AlertCircle size={48} className="text-red-500 mb-4" />
//       <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
//       <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
//       <button 
//         onClick={() => {
//           console.log('Retry button clicked, reloading page');
//           window.location.reload();
//         }}
//         className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
//       >
//         Retry
//       </button>
//     </div>
//   );
// }

// // Main dashboard render function
// console.log('Starting main dashboard render');
// return (
//   <div className="space-y-6">
//     {/* Welcome & Weather Overview */}
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//       {/* Main Weather Card */}
//       <Card className="md:col-span-2">
//         <div className="flex flex-col h-full justify-between">
//           {/* Welcome Section */}
//           <div>
//             <h2 className="text-2xl font-semibold mb-2">
//               {(() => {
//                 const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
//                 console.log('Rendering welcome message for:', userName);
//                 return `Welcome back, ${userName}!`;
//               })()}
//             </h2>
//             <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
//               Here's what's happening with your crews today
//             </p>
//           </div>
          
//           {/* Weather Widget with Error Boundary */}
//           <div className="weather-widget-container">
//             {(() => {
//               try {
//                 console.log('Rendering main WeatherWidgetContainer');
//                 return (
//                   <WeatherWidgetContainer
//                     zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
//                     onWeatherUpdate={(weather) => {
//                       console.log('Weather update received in main widget:', weather);
//                       return (
//                         weather?.current && (
//                           <div className={`mt-4 p-4 rounded-lg ${
//                             weather.current.isRainy || weather.current.isSnowy 
//                               ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
//                               : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
//                           }`}>
//                             <div className="flex items-center">
//                               {weather.current.isRainy || weather.current.isSnowy ? (
//                                 <AlertTriangle size={20} className="text-red-500 dark:text-red-400 mr-2" />
//                               ) : (
//                                 <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2" />
//                               )}
//                               <span className="font-medium">
//                                 {weather.current.isRainy || weather.current.isSnowy 
//                                   ? `Weather Alert: ${weather.current.condition} today. Consider notifying crews.`
//                                   : `All clear: Weather conditions look good for outdoor work today.`
//                                 }
//                               </span>
//                             </div>
//                           </div>
//                         )
//                       );
//                     }}
//                   />
//                 );
//               } catch (error) {
//                 console.error('Error rendering main weather widget:', error);
//                 return <div className="p-4 text-red-500">Weather information unavailable</div>;
//               }
//             })()}
//           </div>
//         </div>
//       </Card>
      
//       {/* Secondary Weather Card */}
//       <Card>
//         {(() => {
//           try {
//             console.log('Rendering secondary WeatherWidgetContainer');
//             return (
//               <WeatherWidgetContainer
//                 zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
//               />
//             );
//           } catch (error) {
//             console.error('Error rendering secondary weather widget:', error);
//             return <div className="p-4 text-red-500">Weather widget unavailable</div>;
//           }
//         })()}
//       </Card>
//     </div>

//     {/* Key Metrics Section */}
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//       {(() => {
//         try {
//           console.log('Rendering metrics section with values:', {
//             activeClients: insights.activeClients,
//             activeWorkers: insights.activeWorkers,
//             pendingEmails: insights.pendingEmails,
//             weatherAlerts: insights.weatherAlerts
//           });
//           return (
//             <>
//               <InsightMetric
//                 title="Active Clients"
//                 value={insights.activeClients}
//                 icon={<Users size={24} />}
//                 change={+8}
//                 linkTo="/clients"
//                 color="blue"
//               />
//               <InsightMetric
//                 title="Active Workers"
//                 value={insights.activeWorkers}
//                 icon={<Briefcase size={24} />}
//                 change={+2}
//                 linkTo="/workers"
//                 color="green"
//               />
//               <InsightMetric
//                 title="Pending Emails"
//                 value={insights.pendingEmails}
//                 icon={<Mail size={24} />}
//                 change={0}
//                 linkTo="/email"
//                 color="purple"
//               />
//               <InsightMetric
//                 title="Weather Alerts"
//                 value={insights.weatherAlerts}
//                 icon={<Cloud size={24} />}
//                 change={+1}
//                 linkTo="/weather"
//                 color={insights.weatherAlerts > 0 ? "red" : "green"}
//               />
//             </>
//           );
//         } catch (error) {
//           console.error('Error rendering metrics section:', error);
//           return <div className="col-span-4 p-4 text-red-500">Metrics unavailable</div>;
//         }
//       })()}
//     </div>

//     {/* Upgrade Prompt Section */}
//     {(() => {
//       try {
//         console.log('Checking subscription plan for upgrade prompt:', subscription?.plan);
//         if (subscription?.plan === 'basic') {
//           return (
//             <UpgradePrompt 
//               features={[
//                 'Multiple jobsite management',
//                 'Jobsite-specific email notifications',
//                 'Advanced analytics',
//                 'Priority support'
//               ]}
//             />
//           );
//         }
//         return null;
//       } catch (error) {
//         console.error('Error rendering upgrade prompt:', error);
//         return null;
//       }
//     })()}

//     {/* Charts and Activity Section */}
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       {/* Email Activity Chart */}
//       <Card>
//         {(() => {
//           try {
//             console.log('Rendering email activity chart with data:', insights.monthlyEmails);
//             return (
//               <>
//                 <h3 className="text-lg font-medium mb-4">Email Activity</h3>
//                 <div className="h-64">
//                   <LineChart 
//                     data={insights.monthlyEmails}
//                     lines={[{
//                       key: 'count',
//                       name: 'Email Count',
//                       color: '#4f46e5'
//                     }]}
//                     xAxisKey="month"
//                     height={300}
//                     showGrid={true}
//                   />
//                 </div>
//               </>
//             );
//           } catch (error) {
//             console.error('Error rendering email activity chart:', error);
//             return <div className="p-4 text-red-500">Chart unavailable</div>;
//           }
//         })()}
//       </Card>
      
//       {/* Recent Activity List */}
//       <Card>
//         {(() => {
//           try {
//             console.log('Rendering recent activity list with items:', recentActivity.length);
//             return (
//               <>
//                 <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
//                 <RecentActivityList activities={recentActivity} />
//               </>
//             );
//           } catch (error) {
//             console.error('Error rendering recent activity list:', error);
//             return <div className="p-4 text-red-500">Activity list unavailable</div>;
//           }
//         })()}
//       </Card>
//     </div>

//     {/* Quick Actions Section */}
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//       {(() => {
//         try {
//           console.log('Rendering quick action cards');
//           return (
//             <>
//               <Link to="/weather">
//                 <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                   <div className="flex items-center">
//                     <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
//                       <Cloud size={20} />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="font-medium">Weather Check</h3>
//                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                         Run manual check
//                       </p>
//                     </div>
//                   </div>
//                 </Card>
//               </Link>
              
//               <Link to="/email">
//                 <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                   <div className="flex items-center">
//                     <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
//                       <Mail size={20} />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="font-medium">Send Notification</h3>
//                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                         Email clients/crews
//                       </p>
//                     </div>
//                   </div>
//                 </Card>
//               </Link>
              
//               <Link to="/clients">
//                 <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                   <div className="flex items-center">
//                     <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
//                       <Users size={20} />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="font-medium">Manage Clients</h3>
//                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                         Add or update
//                       </p>
//                     </div>
//                   </div>
//                 </Card>
//               </Link>
              
//               <Link to={subscription.plan === 'basic' ? '/subscription' : '/jobsites'}>
//                 <Card className="hover:shadow-md transition-shadow cursor-pointer">
//                   <div className="flex items-center">
//                     <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
//                       <Map size={20} />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="font-medium">
//                         {subscription.plan === 'basic' ? 'Upgrade Plan' : 'Manage Jobsites'}
//                       </h3>
//                       <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                         {subscription.plan === 'basic' ? 'Get premium features' : 'View all locations'}
//                       </p>
//                     </div>
//                   </div>
//                 </Card>
//               </Link>
//             </>
//           );
//         } catch (error) {
//           console.error('Error rendering quick action cards:', error);
//           return <div className="col-span-4 p-4 text-red-500">Quick actions unavailable</div>;
//         }
//       })()}
//     </div>
//   </div>
// );
// };

// // Performance monitoring
// console.log('Dashboard component render complete');

// export default Dashboard;











/*   before console logging */
// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useTheme } from '../../hooks/useTheme';
// import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
// import { useSubscription } from '../../hooks/useSubscription';
// import WeatherWidgetContainer from '../../components/weather/WeatherWidgetContainer';
// import { 
//   getActiveClients, 
//   getActiveWorkers, 
//   getPendingEmails,
//   getDashboardData 
// } from '../../services/dataService';

// // Components
// import Card from '../../components/ui/Card';
// import WeatherWidget from '../../components/weather/WeatherWidget';
// import InsightMetric from '../../components/dashboard/InsightMetric';
// import LineChart from '../../components/charts/LineChart';
// import RecentActivityList from '../../components/dashboard/RecentActivityList';
// import UpgradePrompt from '../../components/subscription/UpgradePrompt';


// // Icons
// import {
//   Users,
//   Briefcase,
//   Mail,
//   AlertTriangle,
//   Map,
//   Cloud,
//   TrendingUp,
//   Calendar,
//   CheckCircle,
//   AlertCircle
// } from 'lucide-react';

// const Dashboard: React.FC = () => {
//   const theme = useTheme();
// const darkMode = theme ? theme.darkMode : false;
//   const { user } = useSupabaseAuth();
//   const { subscription } = useSubscription();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [insights, setInsights] = useState<{
//     activeClients: number;
//     activeWorkers: number;
//     pendingEmails: number;
//     weatherAlerts: number;
//     jobsites: number;
//     monthlyEmails: Array<{
//       month: string;
//       count: number;
//     }>;
//   }>({
//     activeClients: 0,
//     activeWorkers: 0,
//     pendingEmails: 0,
//     weatherAlerts: 0,
//     jobsites: 0,
//     monthlyEmails: [],
//   });
  
//   const [recentActivity, setRecentActivity] = useState<Array<{
//     id: number;
//     type: string;
//     message: string;
//     timestamp: string;
//     status: string;
//   }>>([]);
  
//   useEffect(() => {
//     const fetchDashboardData = async () => {
//       try {
//         setLoading(true);
//         console.log('Starting to fetch dashboard data...');
        
//         const { data, error } = await getDashboardData();
//         console.log('Dashboard data response:', { data, error });
        
//         if (error) {
//           console.error('Dashboard data error:', error);
//           throw error;
//         }
        
//         if (!data) {
//           console.error('No data returned from getDashboardData');
//           throw new Error('No data available');
//         }
        
//         console.log('Setting insights with data:', data);
//         setInsights({
//           activeClients: data.clientStats.active,
//           activeWorkers: data.workerStats.active,
//           pendingEmails: data.notificationStats.last30Days,
//           weatherAlerts: data.jobsiteStats.withRecentAlerts,
//           jobsites: subscription.plan === 'basic' ? 1 : data.jobsiteStats.total,
//           monthlyEmails: data.weatherAlertMetrics
//         });
        
//         setRecentActivity(data.recentActivity);
        
//       } catch (err) {
//         console.error('Detailed error in fetchDashboardData:', err);
//         setError('Failed to load dashboard data. Please try again.');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchDashboardData();
//   }, [user, subscription.plan]);
  

//   // Helper functions
//   const countWeatherAlerts = (forecast: any[]) => {
//     return forecast.filter(day => 
//       day.precipitation > 50 || 
//       day.windSpeed > 20 ||
//       day.temperature < 32 ||
//       day.snowfall > 1
//     ).length;
//   };
  
//   const getJobsitesCount = async () => {
//     // This would be implemented with actual data service
//     return 5;
//   };
  
//   const getMonthlyEmailStats = async () => {
//     // Mock data for demonstration
//     return [
//       { month: 'Jan', count: 12 },
//       { month: 'Feb', count: 8 },
//       { month: 'Mar', count: 15 },
//       { month: 'Apr', count: 22 },
//       { month: 'May', count: 18 },
//       { month: 'Jun', count: 10 }
//     ];
//   };
  
//   const getRecentActivity = async () => {
//     // Mock data for demonstration
//     return [
//       { 
//         id: 1, 
//         type: 'email_sent',
//         message: 'Weather alert emails sent to 12 clients',
//         timestamp: '2025-02-18T08:30:00Z',
//         status: 'success'
//       },
//       { 
//         id: 2, 
//         type: 'weather_check',
//         message: 'Weather check completed: Heavy rain detected',
//         timestamp: '2025-02-18T05:00:00Z',
//         status: 'warning'
//       },
//       { 
//         id: 3, 
//         type: 'client_added',
//         message: 'New client "Acme Construction" added',
//         timestamp: '2025-02-17T14:15:00Z',
//         status: 'info'
//       },
//       { 
//         id: 4, 
//         type: 'worker_update',
//         message: 'Updated contact info for 3 workers',
//         timestamp: '2025-02-16T11:22:00Z',
//         status: 'info'
//       }
//     ];
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center p-4">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
//         <div className="text-center">
//           <p className="text-lg font-medium mb-2">Loading your dashboard...</p>
//           <p className="text-sm text-gray-500">This may take a few moments</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center">
//         <AlertCircle size={48} className="text-red-500 mb-4" />
//         <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
//         <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
//         <button 
//           onClick={() => window.location.reload()}
//           className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Welcome & Weather Overview */}
// <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//   <Card className="md:col-span-2">
//     <div className="flex flex-col h-full justify-between">
//       <div>
//         <h2 className="text-2xl font-semibold mb-2">
//           Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
//         </h2>
//         <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
//           Here's what's happening with your crews today
//         </p>
//       </div>
      
//       <WeatherWidgetContainer
//         zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
//         onWeatherUpdate={(weather) => (
//           weather?.current && (
//             <div className={`mt-4 p-4 rounded-lg ${
//               weather.current.isRainy || weather.current.isSnowy 
//                 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
//                 : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
//             }`}>
//               <div className="flex items-center">
//                 {weather.current.isRainy || weather.current.isSnowy ? (
//                   <AlertTriangle size={20} className="text-red-500 dark:text-red-400 mr-2" />
//                 ) : (
//                   <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2" />
//                 )}
//                 <span className="font-medium">
//                   {weather.current.isRainy || weather.current.isSnowy 
//                     ? `Weather Alert: ${weather.current.condition} today. Consider notifying crews.`
//                     : `All clear: Weather conditions look good for outdoor work today.`
//                   }
//                 </span>
//               </div>
//             </div>
//           )
//         )}
//       />
//     </div>
//   </Card>
  
//   <Card>
//     <WeatherWidgetContainer
//       zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
//     />
//   </Card>
// </div>

//       {/* Key Metrics */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         <InsightMetric
//           title="Active Clients"
//           value={insights.activeClients}
//           icon={<Users size={24} />}
//           change={+8}
//           linkTo="/clients"
//           color="blue"
//         />
//         <InsightMetric
//           title="Active Workers"
//           value={insights.activeWorkers}
//           icon={<Briefcase size={24} />}
//           change={+2}
//           linkTo="/workers"
//           color="green"
//         />
//         <InsightMetric
//           title="Pending Emails"
//           value={insights.pendingEmails}
//           icon={<Mail size={24} />}
//           change={0}
//           linkTo="/email"
//           color="purple"
//         />
//         <InsightMetric
//           title="Weather Alerts"
//           value={insights.weatherAlerts}
//           icon={<Cloud size={24} />}
//           change={+1}
//           linkTo="/weather"
//           color={insights.weatherAlerts > 0 ? "red" : "green"}
//         />
//       </div>

//       {/* Upgrade Prompt - Only show for basic plans */}
//       {subscription.plan === 'basic' && (
//         <UpgradePrompt 
//           features={['Multiple jobsite management', 'Jobsite-specific email notifications', 'Advanced analytics', 'Priority support']}
//         />
//       )}

//       {/* Charts and Activity */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         <Card>
//           <h3 className="text-lg font-medium mb-4">Email Activity</h3>
//           <div className="h-64">
//           <LineChart 
//             data={insights.monthlyEmails}
//             lines={[
//               {
//                 key: 'count',
//                 name: 'Email Count',
//                 color: '#4f46e5'
//               }
//             ]}
//             xAxisKey="month"
//             height={300}
//             showGrid={true}
//           />
//           </div>
//         </Card>
        
//         <Card>
//           <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
//           <RecentActivityList activities={recentActivity} />
//         </Card>
//       </div>

//       {/* Quick Actions */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <Link to="/weather">
//           <Card className="hover:shadow-md transition-shadow cursor-pointer">
//             <div className="flex items-center">
//               <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
//                 <Cloud size={20} />
//               </div>
//               <div className="ml-4">
//                 <h3 className="font-medium">Weather Check</h3>
//                 <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Run manual check</p>
//               </div>
//             </div>
//           </Card>
//         </Link>
        
//         <Link to="/email">
//           <Card className="hover:shadow-md transition-shadow cursor-pointer">
//             <div className="flex items-center">
//               <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
//                 <Mail size={20} />
//               </div>
//               <div className="ml-4">
//                 <h3 className="font-medium">Send Notification</h3>
//                 <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email clients/crews</p>
//               </div>
//             </div>
//           </Card>
//         </Link>
        
//         <Link to="/clients">
//           <Card className="hover:shadow-md transition-shadow cursor-pointer">
//             <div className="flex items-center">
//               <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
//                 <Users size={20} />
//               </div>
//               <div className="ml-4">
//                 <h3 className="font-medium">Manage Clients</h3>
//                 <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add or update</p>
//               </div>
//             </div>
//           </Card>
//         </Link>
        
//         <Link to={subscription.plan === 'basic' ? '/subscription' : '/jobsites'}>
//           <Card className="hover:shadow-md transition-shadow cursor-pointer">
//             <div className="flex items-center">
//               <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
//                 <Map size={20} />
//               </div>
//               <div className="ml-4">
//                 <h3 className="font-medium">
//                   {subscription.plan === 'basic' ? 'Upgrade Plan' : 'Manage Jobsites'}
//                 </h3>
//                 <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                   {subscription.plan === 'basic' ? 'Get premium features' : 'View all locations'}
//                 </p>
//               </div>
//             </div>
//           </Card>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;