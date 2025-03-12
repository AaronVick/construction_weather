// src/components/weather/WeatherWidget.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { formatDate } from '../../utils/dateUtils';
import { 
  Cloud, 
  CloudRain, 
  Snowflake, 
  Sun, 
  CloudLightning, 
  CloudFog,
  Wind,
  Droplets,
  MapPin,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { CurrentWeather, ForecastDay, fetchCompleteWeatherData } from '../../services/weatherService';

interface WeatherWidgetProps {
  zipCode: string;
  className?: string;
  showRefresh?: boolean;
}

const WeatherIcon: React.FC<{ condition: string; className?: string }> = ({ condition, className = "w-8 h-8" }) => {
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('thunder') || conditionLower.includes('lightning')) {
    return <CloudLightning className={className} />;
  } else if (conditionLower.includes('rain') || conditionLower.includes('shower') || conditionLower.includes('drizzle')) {
    return <CloudRain className={className} />;
  } else if (conditionLower.includes('snow') || conditionLower.includes('flurr')) {
    return <Snowflake className={className} />;
  } else if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
    return <CloudFog className={className} />;
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return <Cloud className={className} />;
  } else if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return <Sun className={className} />;
  } else {
    return <Cloud className={className} />;
  }
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  zipCode, 
  className = '', 
  showRefresh = true 
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchWeatherData = async () => {
    if (!zipCode) {
      setError('No ZIP code provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const weatherData = await fetchCompleteWeatherData(zipCode, 3);
      
      setCurrent(weatherData.current);
      setForecast(weatherData.forecast);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Unable to load weather data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch weather data on component mount
  useEffect(() => {
    fetchWeatherData();
  }, [zipCode]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (refreshing) return;
    
    setRefreshing(true);
    fetchWeatherData();
  };
  
  if (loading && !refreshing) {
    return (
      <div className={`flex flex-col h-full items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">
          Loading weather data...
        </p>
      </div>
    );
  }
  
  if (error && !current) {
    return (
      <div className={`flex flex-col h-full items-center justify-center ${className}`}>
        <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
        <p className="text-red-500 dark:text-red-400 mb-2">
          {error}
        </p>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
          >
            {refreshing ? 'Refreshing...' : 'Try Again'}
          </button>
        )}
      </div>
    );
  }
  
  if (!current) {
    return (
      <div className={`flex flex-col h-full items-center justify-center ${className}`}>
        <Cloud className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">
          No weather data available
        </p>
      </div>
    );
  }
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Weather Forecast</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="mr-1" />
            <span>{zipCode}</span>
          </div>
          
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Refresh weather data"
            >
              <RefreshCw 
                size={16} 
                className={`text-gray-500 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} 
              />
            </button>
          )}
        </div>
      </div>
      
      {/* Current Weather */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <WeatherIcon 
            condition={current.condition} 
            className={`w-12 h-12 ${current.isRainy ? 'text-blue-500' : current.isSnowy ? 'text-indigo-400' : 'text-amber-500'}`} 
          />
          <div className="ml-3">
            <div className="text-2xl font-bold">{Math.round(current.temperature)}°F</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Feels like {Math.round(current.feelsLike)}°F
            </div>
          </div>
        </div>
        <div>
          <div className="text-right font-medium">{current.condition}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>
      
      {/* Current Details */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Wind size={18} className="text-gray-500 dark:text-gray-400 mb-1" />
          <span className="text-sm font-medium">{current.windSpeed} mph</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Wind</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <Droplets size={18} className="text-blue-500 dark:text-blue-400 mb-1" />
          <span className="text-sm font-medium">{current.humidity}%</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Humidity</span>
        </div>
        <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <CloudRain size={18} className="text-indigo-500 dark:text-indigo-400 mb-1" />
          <span className="text-sm font-medium">{current.precipitation}%</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">Precip</span>
        </div>
      </div>
      
      {/* Forecast */}
      <div className="mt-auto">
        <h4 className="text-sm font-medium mb-2">3-Day Forecast</h4>
        <div className="space-y-3">
          {forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <WeatherIcon 
                  condition={day.condition} 
                  className="w-8 h-8 text-gray-500" 
                />
                <span className="ml-2 text-sm">
                  {formatDate(day.date)}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm">
                  {Math.round(day.temperature.min)}° / {Math.round(day.temperature.max)}°
                </span>
                <div className={`ml-2 w-8 h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`}>
                  <div
                    style={{ width: `${Math.min(100, day.precipitation)}%` }}
                    className={`h-full bg-blue-500 dark:bg-blue-400`}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;