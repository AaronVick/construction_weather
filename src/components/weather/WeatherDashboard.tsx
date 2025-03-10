// src/components/weather/WeatherDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseClient';
import { Jobsite } from '../../types/jobsite';
import { CurrentWeather, ForecastDay, WeatherAlert } from '../../services/weatherService';
import { fetchWeatherForecast, getCurrentWeather } from '../../services/weatherService';
import BasicUserWeatherWidget from './BasicUserWeatherWidget';
import ProUserWeatherDashboard from './ProUserWeatherDashboard';
import { RefreshCw } from 'lucide-react';

interface WeatherDashboardProps {
  className?: string;
}

const WeatherDashboard: React.FC<WeatherDashboardProps> = ({ className }) => {
  const { subscription } = useSubscription();
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const isPro = subscription?.plan === 'premium' || subscription?.plan === 'enterprise';
  
  // Fetch user profile and jobsites
  useEffect(() => {
    async function fetchUserData() {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userProfileRef = doc(db, 'user_profiles', user.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        
        if (userProfileSnap.exists()) {
          setUserProfile(userProfileSnap.data());
        }
        
        // Fetch jobsites if pro user
        if (isPro) {
          try {
            // Import dynamically to avoid circular dependencies
            const { getActiveJobsites } = await import('../../services/jobsiteService');
            const jobsitesData = await getActiveJobsites();
            setJobsites(jobsitesData);
          } catch (err) {
            console.error('Error fetching jobsites:', err);
            setError('Failed to load jobsites');
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [user?.uid, isPro]);
  
  // Fetch weather data for basic users
  useEffect(() => {
    async function fetchBasicUserWeather() {
      if (!userProfile || isPro) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const zipCode = userProfile.zip_code;
        if (!zipCode) {
          setError('No ZIP code found in your profile. Please update your profile settings.');
          return;
        }
        
        // Fetch current weather and forecast in parallel
        const [weatherResponse, forecastResponse] = await Promise.all([
          getCurrentWeather(zipCode, false),
          fetchWeatherForecast(zipCode, 3, false)
        ]);
        
        setCurrentWeather(weatherResponse);
        setForecast(forecastResponse.forecast || []);
        setAlerts(forecastResponse.alerts || []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchBasicUserWeather();
  }, [userProfile, isPro]);
  
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      if (isPro) {
        // Pro users will refresh in the ProUserWeatherDashboard component
        return;
      }
      
      // Basic user refresh
      if (!userProfile?.zip_code) {
        setError('No ZIP code found in your profile. Please update your profile settings.');
        return;
      }
      
      const zipCode = userProfile.zip_code;
      
      // Fetch current weather and forecast in parallel
      const [weatherResponse, forecastResponse] = await Promise.all([
        getCurrentWeather(zipCode, false),
        fetchWeatherForecast(zipCode, 3, false)
      ]);
      
      setCurrentWeather(weatherResponse);
      setForecast(forecastResponse.forecast || []);
      setAlerts(forecastResponse.alerts || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing weather data:', err);
      setError('Failed to refresh weather data');
    } finally {
      setRefreshing(false);
    }
  };
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg ${className || ''}`}>
        <p>{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800/30 rounded-md hover:bg-red-200 dark:hover:bg-red-700/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div className={`${className || ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Weather Dashboard</h2>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Refresh weather data"
          >
            <RefreshCw 
              size={18} 
              className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </div>
      
      {isPro ? (
        <ProUserWeatherDashboard 
          jobsites={jobsites}
          onRefresh={() => setLastUpdated(new Date())}
        />
      ) : (
        <BasicUserWeatherWidget
          currentWeather={currentWeather}
          forecast={forecast}
          alerts={alerts}
          zipCode={userProfile?.zip_code || ''}
        />
      )}
    </div>
  );
};

export default WeatherDashboard;
