// src/pages/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { fetchWeatherForecast, getCurrentWeather } from '../../services/weatherService';
import { getActiveClients, getActiveWorkers, getPendingEmails } from '../../services/dataService';

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
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { user } = useSupabaseAuth();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [insights, setInsights] = useState({
    activeClients: 0,
    activeWorkers: 0,
    pendingEmails: 0,
    weatherAlerts: 0,
    jobsites: 0,
    monthlyEmails: []
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get user preferences
        const zipCode = localStorage.getItem('userZipCode') || user?.user_metadata?.zip_code || '10001';
        
        // Fetch weather data
        const currentWeather = await getCurrentWeather(zipCode);
        const forecast = await fetchWeatherForecast(zipCode, 7);
        
        // Fetch metrics
        const clients = await getActiveClients();
        const workers = await getActiveWorkers();
        const emails = await getPendingEmails();
        
        // Update state
        setWeatherData(currentWeather);
        setForecastData(forecast);
        setInsights({
          activeClients: clients.length,
          activeWorkers: workers.length,
          pendingEmails: emails.length,
          weatherAlerts: countWeatherAlerts(forecast),
          jobsites: subscription.plan === 'basic' ? 1 : await getJobsitesCount(),
          monthlyEmails: await getMonthlyEmailStats()
        });
        
        // Fetch recent activity
        setRecentActivity(await getRecentActivity());
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, subscription.plan]);

  // Helper functions
  const countWeatherAlerts = (forecast: any[]) => {
    return forecast.filter(day => 
      day.precipitation > 50 || 
      day.windSpeed > 20 ||
      day.temperature < 32 ||
      day.snowfall > 1
    ).length;
  };
  
  const getJobsitesCount = async () => {
    // This would be implemented with actual data service
    return 5;
  };
  
  const getMonthlyEmailStats = async () => {
    // Mock data for demonstration
    return [
      { month: 'Jan', count: 12 },
      { month: 'Feb', count: 8 },
      { month: 'Mar', count: 15 },
      { month: 'Apr', count: 22 },
      { month: 'May', count: 18 },
      { month: 'Jun', count: 10 }
    ];
  };
  
  const getRecentActivity = async () => {
    // Mock data for demonstration
    return [
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
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

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
            
            {weatherData?.condition && (
              <div className={`mt-4 p-4 rounded-lg ${weatherData.isRainy || weatherData.isSnowy ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
                <div className="flex items-center">
                  {weatherData.isRainy || weatherData.isSnowy ? (
                    <AlertTriangle size={20} className="text-red-500 dark:text-red-400 mr-2" />
                  ) : (
                    <CheckCircle size={20} className="text-green-500 dark:text-green-400 mr-2" />
                  )}
                  <span className="font-medium">
                    {weatherData.isRainy || weatherData.isSnowy 
                      ? `Weather Alert: ${weatherData.condition} today. Consider notifying crews.`
                      : `All clear: Weather conditions look good for outdoor work today.`
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        <Card>
          <WeatherWidget
            current={weatherData}
            forecast={forecastData.slice(0, 3)}
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
          trend={+8}
          linkTo="/clients"
          color="blue"
        />
        <InsightMetric
          title="Active Workers"
          value={insights.activeWorkers}
          icon={<Briefcase size={24} />}
          trend={+2}
          linkTo="/workers"
          color="green"
        />
        <InsightMetric
          title="Pending Emails"
          value={insights.pendingEmails}
          icon={<Mail size={24} />}
          trend={0}
          linkTo="/email"
          color="purple"
        />
        <InsightMetric
          title="Weather Alerts"
          value={insights.weatherAlerts}
          icon={<Cloud size={24} />}
          trend={+1}
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
              xKey="month"
              yKey="count"
              color="#4f46e5"
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