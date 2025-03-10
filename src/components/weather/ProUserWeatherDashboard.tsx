// src/components/weather/ProUserWeatherDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Jobsite } from '../../types/jobsite';
import { CurrentWeather, ForecastDay, WeatherAlert } from '../../services/weatherService';
import { fetchWeatherForecast, getCurrentWeather } from '../../services/weatherService';
import Card from '../ui/Card';
import { 
  MapPin, 
  RefreshCw, 
  ChevronDown,
  AlertTriangle,
  Search
} from 'lucide-react';
import BasicUserWeatherWidget from './BasicUserWeatherWidget';
import WeatherAlertBanner from './WeatherAlertBanner';
import HourlyForecastDisplay from './HourlyForecastDisplay';

interface ProUserWeatherDashboardProps {
  jobsites: Jobsite[];
  onRefresh: () => void;
}

interface JobsiteWeatherData {
  jobsite: Jobsite;
  currentWeather: CurrentWeather | null;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  lastUpdated: Date | null;
}

const ProUserWeatherDashboard: React.FC<ProUserWeatherDashboardProps> = ({ 
  jobsites,
  onRefresh
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobsiteWeatherData, setJobsiteWeatherData] = useState<JobsiteWeatherData[]>([]);
  const [selectedJobsiteId, setSelectedJobsiteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter jobsites based on search query
  const filteredJobsites = jobsites.filter(jobsite => 
    jobsite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jobsite.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    jobsite.zip_code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get selected jobsite weather data
  const selectedJobsiteWeather = selectedJobsiteId 
    ? jobsiteWeatherData.find(data => data.jobsite.id === selectedJobsiteId)
    : jobsiteWeatherData[0] || null;
  
  // Fetch weather data for all jobsites
  useEffect(() => {
    async function fetchAllJobsitesWeather() {
      try {
        setLoading(true);
        setError(null);
        
        // If no jobsites were passed in, try to fetch them
        let sitesToUse = [...jobsites];
        if (sitesToUse.length === 0) {
          try {
            // Import dynamically to avoid circular dependencies
            const { getActiveJobsites } = await import('../../services/jobsiteService');
            sitesToUse = await getActiveJobsites();
          } catch (err) {
            console.error('Error fetching jobsites:', err);
            setError('Failed to load jobsites');
            setLoading(false);
            return;
          }
        }
        
        if (sitesToUse.length === 0) {
          setLoading(false);
          return;
        }
        
        const weatherDataPromises = sitesToUse.map(async (jobsite) => {
          try {
            const location = jobsite.zip_code;
            const hasCoordinates = jobsite.latitude !== undefined && 
                                  jobsite.latitude !== null && 
                                  jobsite.longitude !== undefined && 
                                  jobsite.longitude !== null;
            
            // Fetch current weather and forecast in parallel
            const [weatherResponse, forecastResponse] = await Promise.all([
              getCurrentWeather(
                location, 
                true, 
                hasCoordinates ? jobsite.latitude : undefined,
                hasCoordinates ? jobsite.longitude : undefined
              ),
              fetchWeatherForecast(
                location, 
                3, 
                true,
                {
                  latitude: hasCoordinates ? jobsite.latitude : undefined,
                  longitude: hasCoordinates ? jobsite.longitude : undefined
                }
              )
            ]);
            
            return {
              jobsite,
              currentWeather: weatherResponse,
              forecast: forecastResponse.forecast || [],
              alerts: forecastResponse.alerts || [],
              lastUpdated: new Date()
            };
          } catch (err) {
            console.error(`Error fetching weather for jobsite ${jobsite.name}:`, err);
            return {
              jobsite,
              currentWeather: null,
              forecast: [],
              alerts: [],
              lastUpdated: null
            };
          }
        });
        
        const weatherData = await Promise.all(weatherDataPromises);
        setJobsiteWeatherData(weatherData);
        
        // Set the first jobsite as selected if none is selected
        if (!selectedJobsiteId && weatherData.length > 0) {
          setSelectedJobsiteId(weatherData[0].jobsite.id);
        }
      } catch (err) {
        console.error('Error fetching jobsite weather data:', err);
        setError('Failed to load weather data for jobsites');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAllJobsitesWeather();
  }, [jobsites]);
  
  const handleRefresh = async () => {
    if (!selectedJobsiteId) return;
    
    try {
      setRefreshing(true);
      setError(null);
      
      const jobsite = jobsites.find(j => j.id === selectedJobsiteId);
      if (!jobsite) return;
      
      const location = jobsite.zip_code;
      const hasCoordinates = jobsite.latitude !== undefined && 
                            jobsite.latitude !== null && 
                            jobsite.longitude !== undefined && 
                            jobsite.longitude !== null;
      
      // Fetch current weather and forecast in parallel
      const [weatherResponse, forecastResponse] = await Promise.all([
        getCurrentWeather(
          location, 
          true, 
          hasCoordinates ? jobsite.latitude : undefined,
          hasCoordinates ? jobsite.longitude : undefined
        ),
        fetchWeatherForecast(
          location, 
          3, 
          true,
          {
            latitude: hasCoordinates ? jobsite.latitude : undefined,
            longitude: hasCoordinates ? jobsite.longitude : undefined
          }
        )
      ]);
      
      // Update the jobsite weather data
      setJobsiteWeatherData(prev => prev.map(data => {
        if (data.jobsite.id === selectedJobsiteId) {
          return {
            ...data,
            currentWeather: weatherResponse,
            forecast: forecastResponse.forecast || [],
            alerts: forecastResponse.alerts || [],
            lastUpdated: new Date()
          };
        }
        return data;
      }));
      
      // Call the onRefresh callback
      onRefresh();
    } catch (err) {
      console.error('Error refreshing weather data:', err);
      setError('Failed to refresh weather data');
    } finally {
      setRefreshing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
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
  
  if (jobsites.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mb-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Jobsites Found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            You don't have any jobsites set up yet. Add jobsites to see weather forecasts for specific locations.
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Jobsite Selector */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobsites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                block w-full pl-10 pr-3 py-2 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>
          
          <div className="relative min-w-[200px]">
            <select
              value={selectedJobsiteId || ''}
              onChange={(e) => setSelectedJobsiteId(e.target.value)}
              className={`
                appearance-none block w-full pl-3 pr-10 py-2 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }
              `}
            >
              {filteredJobsites.map(jobsite => (
                <option key={jobsite.id} value={jobsite.id}>
                  {jobsite.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center px-4 py-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
            aria-label="Refresh weather data"
          >
            <RefreshCw 
              size={16} 
              className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} 
            />
            <span>Refresh</span>
          </button>
        </div>
      </Card>
      
      {/* Selected Jobsite Weather */}
      {selectedJobsiteWeather && (
        <div className="space-y-4">
          {/* Jobsite Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium">{selectedJobsiteWeather.jobsite.name}</h3>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedJobsiteWeather.jobsite.city}, {selectedJobsiteWeather.jobsite.state} {selectedJobsiteWeather.jobsite.zip_code}
            </div>
          </div>
          
          {/* Weather Alerts */}
          {selectedJobsiteWeather.alerts && selectedJobsiteWeather.alerts.length > 0 && (
            <WeatherAlertBanner alerts={selectedJobsiteWeather.alerts} />
          )}
          
          {/* Weather Display */}
          {selectedJobsiteWeather.currentWeather ? (
            <BasicUserWeatherWidget
              currentWeather={selectedJobsiteWeather.currentWeather}
              forecast={selectedJobsiteWeather.forecast}
              alerts={selectedJobsiteWeather.alerts}
              zipCode={selectedJobsiteWeather.jobsite.zip_code}
            />
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Weather data unavailable
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  We couldn't load weather data for this jobsite. Please try refreshing or check back later.
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-700/30 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </Card>
          )}
          
          {/* Last Updated */}
          {selectedJobsiteWeather.lastUpdated && (
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              Last updated: {selectedJobsiteWeather.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProUserWeatherDashboard;
