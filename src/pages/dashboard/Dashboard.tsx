// src/pages/dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Users, Briefcase, Mail, Cloud, AlertTriangle, CheckCircle, BarChart2 } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseClient';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const Dashboard: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState({
    activeClients: 0,
    activeWorkers: 0,
    pendingEmails: 0,
    weatherAlerts: 0
  });

  const { user } = useFirebaseAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching dashboard data...');
        
        if (!user) {
          console.error('No authenticated user found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        // Get active clients count
        const clientsQuery = query(
          collection(db, 'clients'),
          where('user_id', '==', user.uid),
          where('is_active', '==', true)
        );
        const clientsSnapshot = await getCountFromServer(clientsQuery);
        const activeClients = clientsSnapshot.data().count;

        // Get active workers count
        const workersQuery = query(
          collection(db, 'workers'),
          where('user_id', '==', user.uid),
          where('is_active', '==', true)
        );
        const workersSnapshot = await getCountFromServer(workersQuery);
        const activeWorkers = workersSnapshot.data().count;

        // Get pending emails count
        const emailsQuery = query(
          collection(db, 'emails'),
          where('user_id', '==', user.uid),
          where('status', '==', 'pending')
        );
        const emailsSnapshot = await getCountFromServer(emailsQuery);
        const pendingEmails = emailsSnapshot.data().count;

        // Get weather alerts count
        const alertsQuery = query(
          collection(db, 'weather_alerts'),
          where('user_id', '==', user.uid),
          where('is_active', '==', true)
        );
        const alertsSnapshot = await getCountFromServer(alertsQuery);
        const weatherAlerts = alertsSnapshot.data().count;
        
        setData({
          activeClients,
          activeWorkers,
          pendingEmails,
          weatherAlerts
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
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
