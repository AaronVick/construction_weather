// src/pages/dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSubscription } from '../../hooks/useSubscription';
import WeatherWidgetContainer from '../../components/weather/WeatherWidgetContainer';
import { 
  getActiveClients, 
  getActiveWorkers, 
  getPendingEmails,
  getDashboardData 
} from '../../services/dataService';


// Components
import Card from '../../components/ui/Card';
import WeatherWidget from '../../components/weather/WeatherWidget';
import InsightMetric from '../../components/dashboard/InsightMetric';
import LineChart from '../../components/charts/LineChart';
import RecentActivityList from '../../components/dashboard/RecentActivityList';
import UpgradePrompt from '../../components/subscription/UpgradePrompt';


// Icons
import {
  Users,
  Briefcase,
  Mail,
  AlertTriangle,
  Map,
  Cloud,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';


const Dashboard: React.FC = () => {
  // Hook initialization
  const theme = useTheme();
  const { user } = useSupabaseAuth();
  const { subscription } = useSubscription();
  const darkMode = theme ? theme.darkMode : false;

  // State initialization
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    activeClients: number;
    activeWorkers: number;
    pendingEmails: number;
    weatherAlerts: number;
    jobsites: number;
    monthlyEmails: Array<{
      month: string;
      count: number;
    }>;
  }>({
    activeClients: 0,
    activeWorkers: 0,
    pendingEmails: 0,
    weatherAlerts: 0,
    jobsites: 0,
    monthlyEmails: [],
  });
  
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    type: string;
    message: string;
    timestamp: string;
    status: string;
  }>>([]);

  // Debug logging (moved after state declarations)
  console.log('Dashboard Render State:', {
    loading,
    error,
    hasInsights: !!insights,
    hasRecentActivity: recentActivity.length > 0,
    pathname: location.pathname,
    user: !!user,
    subscription: subscription?.plan
  });

  console.log('Theme hook initialized:', { darkMode: theme?.darkMode });
  console.log('Auth hook initialized:', { 
    userEmail: user?.email,
    userMetadata: user?.user_metadata 
  });
  console.log('Subscription hook initialized:', { plan: subscription?.plan });
  console.log('Initial insights state:', insights);
  console.log('Initial recent activity state:', recentActivity);

  // Service test effect
  useEffect(() => {
    const testService = async () => {
      try {
        console.log('Testing getDashboardData service...');
        const response = await getDashboardData();
        console.log('Service Response:', response);
      } catch (e) {
        console.error('Service Test Error:', e);
      }
    };
    testService();
  }, []);
  
  
// Main data fetching effect
useEffect(() => {
  const fetchDashboardData = async () => {
    console.log('Starting fetchDashboardData execution');
    try {
      setLoading(true);
      console.log('Loading state set to true');
      
      // Get user preferences
      const zipCode = localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001';
      console.log('Retrieved zip code for weather data:', zipCode);
      
      // Fetch dashboard metrics
      console.log('Initiating getDashboardData API call');
      const { data, error } = await getDashboardData();
      console.log('getDashboardData response received:', { 
        hasData: !!data, 
        hasError: !!error,
        errorDetails: error
      });
      
      if (error) {
        console.error('Error from getDashboardData:', error);
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from getDashboardData');
        throw new Error('No data available');
      }
      
      console.log('Processing dashboard data:', {
        clientStats: data.clientStats,
        workerStats: data.workerStats,
        notificationStats: data.notificationStats,
        jobsiteStats: data.jobsiteStats
      });

      // Update insights state
      const newInsights = {
        activeClients: data.clientStats.active,
        activeWorkers: data.workerStats.active,
        pendingEmails: data.notificationStats.last30Days,
        weatherAlerts: data.jobsiteStats.withRecentAlerts,
        jobsites: subscription.plan === 'basic' ? 1 : data.jobsiteStats.total,
        monthlyEmails: data.weatherAlertMetrics
      };
      console.log('Setting new insights:', newInsights);
      setInsights(newInsights);
      
      console.log('Setting recent activity:', data.recentActivity);
      setRecentActivity(data.recentActivity);
      
    } catch (err: unknown) {
      console.error('Detailed error in fetchDashboardData:', {
        error: err,
        message: err instanceof Error ? err.message : 'An unknown error occurred',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      console.log('Completing fetchDashboardData, setting loading to false');
      setLoading(false);
    }
  };

  fetchDashboardData();
}, [user, subscription.plan]);


// Helper functions with logging
const countWeatherAlerts = (forecast: any[]) => {
  console.log('Counting weather alerts from forecast data:', forecast);
  const alertCount = forecast.filter(day => 
    day.precipitation > 50 || 
    day.windSpeed > 20 ||
    day.temperature < 32 ||
    day.snowfall > 1
  ).length;
  console.log('Weather alert count:', alertCount);
  return alertCount;
};

const getJobsitesCount = async () => {
  console.log('Fetching jobsites count');
  // This would be implemented with actual data service
  const count = 5;
  console.log('Jobsites count:', count);
  return count;
};

const getMonthlyEmailStats = async () => {
  console.log('Fetching monthly email stats');
  // Mock data for demonstration
  const stats = [
    { month: 'Jan', count: 12 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 15 },
    { month: 'Apr', count: 22 },
    { month: 'May', count: 18 },
    { month: 'Jun', count: 10 }
  ];
  console.log('Monthly email stats:', stats);
  return stats;
};


const getRecentActivity = async () => {
  console.log('Fetching recent activity');
  // Mock data for demonstration
  const activity = [
    { 
      id: 1, 
      type: 'email_sent',
      message: 'Weather alert emails sent to 12 clients',
      timestamp: '2025-02-18T08:30:00Z',
      status: 'success'
    },
    { 
      id: 2, 
      type: 'weather_check',
      message: 'Weather check completed: Heavy rain detected',
      timestamp: '2025-02-18T05:00:00Z',
      status: 'warning'
    },
    { 
      id: 3, 
      type: 'client_added',
      message: 'New client "Acme Construction" added',
      timestamp: '2025-02-17T14:15:00Z',
      status: 'info'
    },
    { 
      id: 4, 
      type: 'worker_update',
      message: 'Updated contact info for 3 workers',
      timestamp: '2025-02-16T11:22:00Z',
      status: 'info'
    }
  ];
  console.log('Recent activity data:', activity);
  return activity;
};

// Render loading state
if (loading) {
  console.log('Rendering loading state');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Loading your dashboard...</p>
        <p className="text-sm text-gray-500">This may take a few moments</p>
      </div>
    </div>
  );
}

// Render error state
if (error) {
  console.log('Rendering error state:', error);
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
      <button 
        onClick={() => {
          console.log('Retry button clicked, reloading page');
          window.location.reload();
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

console.log('Rendering main dashboard content');
return (
  <div className="space-y-6">
    {/* Welcome & Weather Overview */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <div className="flex flex-col h-full justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}!
            </h2>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Here's what's happening with your crews today
            </p>
          </div>
          
          <WeatherWidgetContainer
            zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
            onWeatherUpdate={(weather) => {
              console.log('Weather update received:', weather);
              return (
                weather?.current && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    weather.current.isRainy || weather.current.isSnowy 
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  }`}>
                    <div className="flex items-center">
                      {weather.current.isRainy || weather.current.isSnowy ? (
                        <AlertTriangle size={20} className="text-red-500 dark:text-red-400 mr-2" />
                      ) : (
                        <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2" />
                      )}
                      <span className="font-medium">
                        {weather.current.isRainy || weather.current.isSnowy 
                          ? `Weather Alert: ${weather.current.condition} today. Consider notifying crews.`
                          : `All clear: Weather conditions look good for outdoor work today.`
                        }
                      </span>
                    </div>
                  </div>
                )
              );
            }}
          />
        </div>
      </Card>
      
      <Card>
        <WeatherWidgetContainer
          zipCode={localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001'}
        />
      </Card>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <InsightMetric
        title="Active Clients"
        value={insights.activeClients}
        icon={<Users size={24} />}
        change={+8}
        linkTo="/clients"
        color="blue"
      />
      <InsightMetric
        title="Active Workers"
        value={insights.activeWorkers}
        icon={<Briefcase size={24} />}
        change={+2}
        linkTo="/workers"
        color="green"
      />
      <InsightMetric
        title="Pending Emails"
        value={insights.pendingEmails}
        icon={<Mail size={24} />}
        change={0}
        linkTo="/email"
        color="purple"
      />
      <InsightMetric
        title="Weather Alerts"
        value={insights.weatherAlerts}
        icon={<Cloud size={24} />}
        change={+1}
        linkTo="/weather"
        color={insights.weatherAlerts > 0 ? "red" : "green"}
      />
    </div>

    {/* Upgrade Prompt - Only show for basic plans */}
    {subscription.plan === 'basic' && (
      <UpgradePrompt 
        features={['Multiple jobsite management', 'Jobsite-specific email notifications', 'Advanced analytics', 'Priority support']}
      />
    )}

    {/* Charts and Activity */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-medium mb-4">Email Activity</h3>
        <div className="h-64">
          <LineChart 
            data={insights.monthlyEmails}
            lines={[
              {
                key: 'count',
                name: 'Email Count',
                color: '#4f46e5'
              }
            ]}
            xAxisKey="month"
            height={300}
            showGrid={true}
          />
        </div>
      </Card>
      
      <Card>
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <RecentActivityList activities={recentActivity} />
      </Card>
    </div>

    {/* Quick Actions */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Link to="/weather">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Cloud size={20} />
            </div>
            <div className="ml-4">
              <h3 className="font-medium">Weather Check</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Run manual check</p>
            </div>
          </div>
        </Card>
      </Link>
      
      <Link to="/email">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <Mail size={20} />
            </div>
            <div className="ml-4">
              <h3 className="font-medium">Send Notification</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email clients/crews</p>
            </div>
          </div>
        </Card>
      </Link>
      
      <Link to="/clients">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Users size={20} />
            </div>
            <div className="ml-4">
              <h3 className="font-medium">Manage Clients</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add or update</p>
            </div>
          </div>
        </Card>
      </Link>
      
      <Link to={subscription.plan === 'basic' ? '/subscription' : '/jobsites'}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Map size={20} />
            </div>
            <div className="ml-4">
              <h3 className="font-medium">
                {subscription.plan === 'basic' ? 'Upgrade Plan' : 'Manage Jobsites'}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {subscription.plan === 'basic' ? 'Get premium features' : 'View all locations'}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  </div>
);
};

export default Dashboard;











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