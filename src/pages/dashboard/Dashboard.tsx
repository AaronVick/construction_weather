// src/pages/dashboard/Dashboard.tsx

// src/pages/dashboard/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { 
  Users, Briefcase, Mail, Cloud, AlertTriangle, CheckCircle, BarChart2,
  Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, AlertCircle, CloudOff,
  Thermometer, Wind
} from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db, auth } from '@/lib/firebaseClient';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { 
  fetchCompleteWeatherData, 
  CurrentWeather, 
  ForecastDay, 
  WeatherAlert 
} from '@/services/weatherService';

const Dashboard: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastData, setForecastData] = useState<ForecastDay[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [userZipCode, setUserZipCode] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [data, setData] = useState({
    activeClients: 0,
    activeWorkers: 0,
    pendingEmails: 0,
    weatherAlerts: 0
  });

  const { user } = useFirebaseAuth();

  const fetchWeatherData = async (zipCode: string) => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      
      console.log('Fetching weather data for zip code:', zipCode);
      
      const weatherData = await fetchCompleteWeatherData(zipCode);
      
      setCurrentWeather(weatherData.current);
      setForecastData(weatherData.forecast);
      setWeatherAlerts(weatherData.alerts);
      
      // Update weather alerts count for dashboard metrics
      setData(prevData => ({
        ...prevData,
        weatherAlerts: weatherData.alerts.length
      }));
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setWeatherError('Unable to load weather data');
    } finally {
      setWeatherLoading(false);
    }
  };
  
  // Complete useEffect implementation
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
  
        // Get weather alerts count - will be updated when we fetch weather data
        const alertsQuery = query(
          collection(db, 'weather_alerts'),
          where('user_id', '==', user.uid),
          where('is_active', '==', true)
        );
        const alertsSnapshot = await getCountFromServer(alertsQuery);
        const weatherAlertsCount = alertsSnapshot.data().count;
  
        // Get user profile for zip code
        const profileQuery = query(
          collection(db, 'user_profiles'),
          where('user_id', '==', user.uid)
        );
        
        const profileSnapshot = await getDocs(profileQuery);
        
        if (!profileSnapshot.empty) {
          const userProfile = profileSnapshot.docs[0].data();
          const zipCode = userProfile.zip_code;
          
          if (zipCode) {
            setUserZipCode(zipCode);
            // Fetch weather data after setting the zip code
            fetchWeatherData(zipCode);
          }
        }
        
        setData({
          activeClients,
          activeWorkers,
          pendingEmails,
          weatherAlerts: weatherAlertsCount // Will be updated when weather data is fetched
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

  const handleRefreshWeather = async () => {
    if (!userZipCode) return;
    await fetchWeatherData(userZipCode);
  };

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

  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('thunder') || conditionLower.includes('lightning')) {
      return <CloudLightning className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-3" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('shower') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
    } else if (conditionLower.includes('snow') || conditionLower.includes('flurr')) {
      return <CloudSnow className="w-5 h-5 text-blue-300 dark:text-blue-200 mr-3" />;
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
      return <CloudFog className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
    } else if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-3" />;
    } else {
      return <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
    }
  };
  
  // Function to format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
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
                {weatherAlerts.length || data.weatherAlerts}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              weatherAlerts.length > 0 || data.weatherAlerts > 0
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <Cloud className={`w-6 h-6 ${
                weatherAlerts.length > 0 || data.weatherAlerts > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
          {(weatherAlerts.length > 0 || data.weatherAlerts > 0) && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {weatherAlerts.length > 0 
                  ? `${weatherAlerts.length} active weather ${weatherAlerts.length === 1 ? 'alert' : 'alerts'}`
                  : `${data.weatherAlerts} active weather ${data.weatherAlerts === 1 ? 'alert' : 'alerts'}`}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex justify-between">
            <span>Weather Overview</span>
            {userZipCode && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {userZipCode}
              </span>
            )}
          </h2>
          {currentWeather ? (
            <div className="flex items-center">
              {currentWeather.isRainy || currentWeather.isSnowy || (currentWeather.windSpeed > 20) ? (
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              )}
              <span className="text-gray-600 dark:text-gray-300">
                {currentWeather.isRainy || currentWeather.isSnowy || (currentWeather.windSpeed > 20) 
                  ? `Current conditions may impact outdoor work: ${currentWeather.condition}, ${currentWeather.temperature}°F` 
                  : `Weather conditions are favorable for outdoor work: ${currentWeather.condition}, ${currentWeather.temperature}°F`}
              </span>
            </div>
          ) : weatherLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">Loading weather data...</span>
            </div>
          ) : weatherError ? (
            <div className="flex items-center text-red-500">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{weatherError}</span>
            </div>
          ) : !userZipCode ? (
            <div className="flex items-center text-amber-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>No ZIP code found in your profile</span>
            </div>
          ) : (
            <div className="flex items-center">
              <CloudOff className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-gray-500">No weather data available</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Weather Check Action */}
        <button 
          onClick={handleRefreshWeather}
          disabled={weatherLoading || !userZipCode}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Cloud className={`w-6 h-6 text-blue-600 dark:text-blue-400 ${weatherLoading ? 'animate-pulse' : ''}`} />
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Weather Check
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {weatherLoading ? 'Checking...' : 'Run manual check'}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              5-Day Forecast {userZipCode && `(${userZipCode})`}
            </h2>
            {currentWeather && (
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                <div className="flex items-center mr-3">
                  {getWeatherIcon(currentWeather.condition)}
                  <span className="text-blue-700 dark:text-blue-300 font-medium">
                    {currentWeather.temperature}°F
                  </span>
                </div>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                  <span className="mr-2">Now</span>
                  <span>{currentWeather.condition}</span>
                </div>
              </div>
            )}
          </div>
          
          {weatherLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : weatherError ? (
            <div className="flex items-center justify-center h-48 text-red-500">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>{weatherError}</span>
            </div>
          ) : !userZipCode ? (
            <div className="flex items-center justify-center h-48 text-amber-500">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>No zip code available in profile</span>
            </div>
          ) : forecastData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <CloudOff className="w-5 h-5 mr-2" />
              <span>No forecast data available</span>
            </div>
          ) : (
            <div className="space-y-4">
              {forecastData.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <div className="flex items-center">
                    {getWeatherIcon(day.condition)}
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(day.date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs">
                      <Thermometer className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {day.temperature.max}°
                      </span>
                      <span className="mx-1 text-gray-400">/</span>
                      <span className="text-gray-500 dark:text-gray-500">
                        {day.temperature.min}°
                      </span>
                    </div>
                    
                    {day.precipitation > 0 && (
                      <div className="flex items-center text-xs">
                        <CloudRain className="w-4 h-4 text-blue-500 mr-1" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {Math.round(day.precipitation)}%
                        </span>
                      </div>
                    )}
                    
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.condition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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


// import React, { useState, useEffect } from 'react';
// import { useTheme } from '@/hooks/useTheme';
// import { 
//   CurrentWeather, 
//   ForecastDay, 
//   WeatherWidgetForecast 
// } from '@/types/weather';
// import { 
//   Users, Briefcase, Mail, Cloud, AlertTriangle, CheckCircle, BarChart2,
//   Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, AlertCircle, CloudOff,
//   Thermometer, Wind
// } from 'lucide-react';import LoadingScreen from '@/components/ui/LoadingScreen';
// import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
// import { db, auth } from '@/lib/firebaseClient';
// import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';



// const Dashboard: React.FC = () => {
//   const { darkMode } = useTheme();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [forecastData, setForecastData] = useState<WeatherWidgetForecast[]>([]);
//   const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
//   const [userZipCode, setUserZipCode] = useState<string | null>(null);
//   const [weatherLoading, setWeatherLoading] = useState(false);
//   const [weatherError, setWeatherError] = useState<string | null>(null);
//   const [data, setData] = useState({
//     activeClients: 0,
//     activeWorkers: 0,
//     pendingEmails: 0,
//     weatherAlerts: 0
//   });

//   const { user } = useFirebaseAuth();

//   const fetchWeatherData = async (zipCode: string) => {
//     try {
//       setWeatherLoading(true);
      
//       // Direct call to WeatherAPI.com as a backup solution
//       // This bypasses your API infrastructure but will work for dashboard display
//       const weatherApiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY; // Make sure this is exposed to the client
//       const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${zipCode}&days=5&aqi=no&alerts=yes`;
      
//       const response = await fetch(apiUrl);
      
//       if (!response.ok) {
//         throw new Error(`Weather API error: ${response.status}`);
//       }
      
//       const weatherData = await response.json();
      
//       // Process current weather data
//       const current: CurrentWeather = {
//         temperature: Math.round(weatherData.current.temp_f),
//         feelsLike: Math.round(weatherData.current.feelslike_f),
//         condition: weatherData.current.condition.text,
//         humidity: weatherData.current.humidity,
//         windSpeed: weatherData.current.wind_mph,
//         precipitation: weatherData.current.precip_in,
//         isRainy: weatherData.current.precip_in > 0 && weatherData.current.condition.text.toLowerCase().includes('rain'),
//         isSnowy: weatherData.current.condition.text.toLowerCase().includes('snow'),
//         icon: weatherData.current.condition.icon
//       };
      
//       setCurrentWeather(current);
      
//       // Process forecast data
//       const forecast: WeatherWidgetForecast[] = weatherData.forecast.forecastday.map((day: any): WeatherWidgetForecast => ({
//         date: day.date,
//         temperature: {
//           min: Math.round(day.day.mintemp_f),
//           max: Math.round(day.day.maxtemp_f)
//         },
//         condition: day.day.condition.text,
//         precipitation: day.day.daily_chance_of_rain / 100, // Convert percentage to decimal
//         icon: day.day.condition.icon
//       }));
      
//       setForecastData(forecast);
//       setWeatherError(null);
//     } catch (err) {
//       console.error('Error fetching weather data:', err);
//       setWeatherError('Unable to load weather data');
//     } finally {
//       setWeatherLoading(false);
//     }
//   };
  
//   // Complete useEffect implementation
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         console.log('Fetching dashboard data...');
        
//         if (!user) {
//           console.error('No authenticated user found');
//           setError('Authentication required');
//           setLoading(false);
//           return;
//         }
  
//         // Get active clients count
//         const clientsQuery = query(
//           collection(db, 'clients'),
//           where('user_id', '==', user.uid),
//           where('is_active', '==', true)
//         );
//         const clientsSnapshot = await getCountFromServer(clientsQuery);
//         const activeClients = clientsSnapshot.data().count;
  
//         // Get active workers count
//         const workersQuery = query(
//           collection(db, 'workers'),
//           where('user_id', '==', user.uid),
//           where('is_active', '==', true)
//         );
//         const workersSnapshot = await getCountFromServer(workersQuery);
//         const activeWorkers = workersSnapshot.data().count;
  
//         // Get pending emails count
//         const emailsQuery = query(
//           collection(db, 'emails'),
//           where('user_id', '==', user.uid),
//           where('status', '==', 'pending')
//         );
//         const emailsSnapshot = await getCountFromServer(emailsQuery);
//         const pendingEmails = emailsSnapshot.data().count;
  
//         // Get weather alerts count
//         const alertsQuery = query(
//           collection(db, 'weather_alerts'),
//           where('user_id', '==', user.uid),
//           where('is_active', '==', true)
//         );
//         const alertsSnapshot = await getCountFromServer(alertsQuery);
//         const weatherAlerts = alertsSnapshot.data().count;
  
//         // Get user profile for zip code
//         const profileQuery = query(
//           collection(db, 'user_profiles'),
//           where('user_id', '==', user.uid)
//         );
        
//         const profileSnapshot = await getDocs(profileQuery);
        
//         if (!profileSnapshot.empty) {
//           const userProfile = profileSnapshot.docs[0].data();
//           const zipCode = userProfile.zip_code;
          
//           if (zipCode) {
//             setUserZipCode(zipCode);
//             fetchWeatherData(zipCode);
//           }
//         }
        
//         setData({
//           activeClients,
//           activeWorkers,
//           pendingEmails,
//           weatherAlerts
//         });
//         setError(null);
//       } catch (err) {
//         console.error('Error fetching dashboard data:', err);
//         setError('Failed to load dashboard data');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     if (user) {
//       fetchData();
//     }
//   }, [user]);

//   if (loading) {
//     return <LoadingScreen message="Loading dashboard..." />;
//   }

//   if (error) {
//     return (
//       <div className="min-h-[50vh] flex items-center justify-center">
//         <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg text-center">
//           <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
//             {error}
//           </h3>
//           <button
//             onClick={() => window.location.reload()}
//             className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const getWeatherIcon = (iconCode: string) => {
//     // Map your weather API icon codes to Lucide icons
//     // You'll need to customize this based on your API's icon system
//     if (iconCode.includes('sunny') || iconCode.includes('clear')) {
//       return <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-3" />;
//     } else if (iconCode.includes('rain')) {
//       return <CloudRain className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
//     } else if (iconCode.includes('thunder') || iconCode.includes('lightning')) {
//       return <CloudLightning className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-3" />;
//     } else if (iconCode.includes('snow')) {
//       return <CloudSnow className="w-5 h-5 text-blue-300 dark:text-blue-200 mr-3" />;
//     } else if (iconCode.includes('fog') || iconCode.includes('mist')) {
//       return <CloudFog className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />;
//     } else if (iconCode.includes('cloud')) {
//       return <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
//     } else {
//       return <Cloud className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-3" />;
//     }
//   };
  
//   // Function to format date from ISO string
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
//   };
  
  
//   return (
//     <div className="space-y-6">
//       {/* Welcome Section */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//         <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
//           Welcome back!
//         </h1>
//         <p className="text-gray-600 dark:text-gray-300">
//           Here's what's happening with your crews today
//         </p>
//       </div>

//       {/* Key Metrics Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Active Clients */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                 Active Clients
//               </p>
//               <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
//                 {data.activeClients}
//               </p>
//             </div>
//             <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
//               <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//             </div>
//           </div>
//         </div>

//         {/* Active Workers */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                 Active Workers
//               </p>
//               <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
//                 {data.activeWorkers}
//               </p>
//             </div>
//             <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
//               <Briefcase className="w-6 h-6 text-green-600 dark:text-green-400" />
//             </div>
//           </div>
//         </div>

//         {/* Pending Emails */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                 Pending Emails
//               </p>
//               <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
//                 {data.pendingEmails}
//               </p>
//             </div>
//             <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
//               <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//             </div>
//           </div>
//         </div>

//         {/* Weather Alerts */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                 Weather Alerts
//               </p>
//               <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
//                 {data.weatherAlerts}
//               </p>
//             </div>
//             <div className={`p-3 rounded-lg ${
//               data.weatherAlerts > 0 
//                 ? 'bg-red-100 dark:bg-red-900/30' 
//                 : 'bg-green-100 dark:bg-green-900/30'
//             }`}>
//               <Cloud className={`w-6 h-6 ${
//                 data.weatherAlerts > 0
//                   ? 'text-red-600 dark:text-red-400'
//                   : 'text-green-600 dark:text-green-400'
//               }`} />
//             </div>
//           </div>
//           {data.weatherAlerts > 0 && (
//             <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center">
//               <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
//               <span className="text-sm text-red-700 dark:text-red-300">
//                 {data.weatherAlerts} active weather alerts
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Additional Content */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Recent Activity */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//             Recent Activity
//           </h2>
//           <div className="space-y-4">
//             {/* Activity items would go here */}
//             <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
//           </div>
//         </div>

//         {/* Weather Overview */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//             Weather Overview
//           </h2>
//           <div className="flex items-center">
//             <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
//             <span className="text-gray-600 dark:text-gray-300">
//               Weather conditions are favorable for outdoor work
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Quick Actions Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Weather Check Action */}
//         <button 
//           onClick={() => console.log('Weather check clicked')}
//           className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
//         >
//           <div className="flex items-center">
//             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
//               <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//             </div>
//             <div className="ml-4">
//               <h3 className="font-medium text-gray-900 dark:text-white">
//                 Weather Check
//               </h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Run manual check
//               </p>
//             </div>
//           </div>
//         </button>

//         {/* Send Notification Action */}
//         <button 
//           onClick={() => console.log('Send notification clicked')}
//           className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
//         >
//           <div className="flex items-center">
//             <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
//               <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
//             </div>
//             <div className="ml-4">
//               <h3 className="font-medium text-gray-900 dark:text-white">
//                 Send Notification
//               </h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Email clients/crews
//               </p>
//             </div>
//           </div>
//         </button>

//         {/* Manage Clients Action */}
//         <button 
//           onClick={() => console.log('Manage clients clicked')}
//           className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
//         >
//           <div className="flex items-center">
//             <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
//               <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//             </div>
//             <div className="ml-4">
//               <h3 className="font-medium text-gray-900 dark:text-white">
//                 Manage Clients
//               </h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Add or update
//               </p>
//             </div>
//           </div>
//         </button>

//         {/* View Reports Action */}
//         <button 
//           onClick={() => console.log('View reports clicked')}
//           className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
//         >
//           <div className="flex items-center">
//             <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
//               <BarChart2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
//             </div>
//             <div className="ml-4">
//               <h3 className="font-medium text-gray-900 dark:text-white">
//                 View Reports
//               </h3>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Analytics & insights
//               </p>
//             </div>
//           </div>
//         </button>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Email Activity Chart */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//             Email Activity
//           </h2>
//           <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
//             Chart placeholder
//           </div>
//         </div>

//         {/* Weather Forecast */}
// <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//   <div className="flex justify-between items-center mb-4">
//     <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//       5-Day Forecast {userZipCode && `(${userZipCode})`}
//     </h2>
//     {currentWeather && (
//       <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
//         <div className="flex items-center mr-3">
//           {getWeatherIcon(currentWeather.icon)}
//           <span className="text-blue-700 dark:text-blue-300 font-medium">
//             {currentWeather.temperature}°F
//           </span>
//         </div>
//         <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
//           <span className="mr-2">Now</span>
//           <span>{currentWeather.condition}</span>
//         </div>
//       </div>
//     )}
//   </div>
  
//   {weatherLoading ? (
//     <div className="flex justify-center items-center h-48">
//       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
//     </div>
//   ) : weatherError ? (
//     <div className="flex items-center justify-center h-48 text-red-500">
//       <AlertTriangle className="w-5 h-5 mr-2" />
//       <span>{weatherError}</span>
//     </div>
//   ) : !userZipCode ? (
//     <div className="flex items-center justify-center h-48 text-amber-500">
//       <AlertCircle className="w-5 h-5 mr-2" />
//       <span>No zip code available in profile</span>
//     </div>
//   ) : forecastData.length === 0 ? (
//     <div className="flex items-center justify-center h-48 text-gray-500">
//       <CloudOff className="w-5 h-5 mr-2" />
//       <span>No forecast data available</span>
//     </div>
//   ) : (
//     <div className="space-y-4">
//       {forecastData.map((day, index) => (
//         <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
//           <div className="flex items-center">
//             {getWeatherIcon(day.icon)}
//             <span className="text-gray-700 dark:text-gray-300">
//               {formatDate(day.date)}
//             </span>
//           </div>
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center text-xs">
//               <Thermometer className="w-4 h-4 text-red-500 mr-1" />
//               <span className="text-gray-600 dark:text-gray-400">
//                 {day.temperature.max}°
//               </span>
//               <span className="mx-1 text-gray-400">/</span>
//               <span className="text-gray-500 dark:text-gray-500">
//                 {day.temperature.min}°
//               </span>
//             </div>
            
//             {day.precipitation > 0 && (
//               <div className="flex items-center text-xs">
//                 <CloudRain className="w-4 h-4 text-blue-500 mr-1" />
//                 <span className="text-gray-600 dark:text-gray-400">
//                   {Math.round(day.precipitation * 100)}%
//                 </span>
//               </div>
//             )}
            
//             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//               {day.condition}
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   )}
// </div>
//         </div>


//       {/* Premium Features Banner */}
//       <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold mb-2">
//               Upgrade to Premium
//             </h2>
//             <p className="text-blue-100">
//               Get access to advanced features and analytics
//             </p>
//           </div>
//           <button 
//             onClick={() => console.log('Upgrade clicked')}
//             className="px-6 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
//           >
//             Upgrade Now
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
