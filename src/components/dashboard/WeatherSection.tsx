// src/components/dashboard/WeatherSection.tsx
import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  CloudOff, 
  AlertCircle,
  Cloud,
  Sun,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Thermometer
} from 'lucide-react';
import ErrorBoundary from '../ui/ErrorBoundary';
import { CurrentWeather } from '@/services/weatherService';
import { ForecastDay } from '@/types/weather';

interface WeatherSectionProps {
  currentWeather: CurrentWeather | null;
  forecastData: ForecastDay[];
  userZipCode: string | null;
  weatherLoading: boolean;
  weatherError: string | null;
  onRefresh: () => void;
}

const WeatherSection: React.FC<WeatherSectionProps> = ({
  currentWeather,
  forecastData,
  userZipCode,
  weatherLoading,
  weatherError,
  onRefresh
}) => {
  
  // Function to format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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

  return (
    <ErrorBoundary section="weather dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <button
                onClick={onRefresh}
                className="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded"
              >
                Retry
              </button>
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
              <button
                onClick={onRefresh}
                className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                Refresh
              </button>
            </div>
          )}
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
    </ErrorBoundary>
  );
};

export default WeatherSection;