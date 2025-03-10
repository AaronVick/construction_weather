// src/components/weather/BasicUserWeatherWidget.tsx
import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { formatDate } from '../../utils/dateUtils';
import { CurrentWeather, ForecastDay, WeatherAlert } from '../../services/weatherService';
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
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Clock
} from 'lucide-react';
import Card from '../ui/Card';
import WeatherAlertBanner from './WeatherAlertBanner';
import HourlyForecastDisplay from './HourlyForecastDisplay';

interface BasicUserWeatherWidgetProps {
  currentWeather: CurrentWeather | null;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  zipCode: string;
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

// Helper function to determine if a condition might impact outdoor work
const isWorkImpactingCondition = (weather: CurrentWeather | ForecastDay): boolean => {
  if ('isRainy' in weather && weather.isRainy) return true;
  if ('isSnowy' in weather && weather.isSnowy) return true;
  if ('isExtreme' in weather && weather.isExtreme) return true;
  
  // Check wind speed (over 20 mph might impact work)
  if (weather.windSpeed > 20) return true;
  
  // Check precipitation probability (over 50% chance)
  if ('precipitation' in weather && weather.precipitation > 50) return true;
  
  // Check temperature (below 32°F or above 95°F might impact work)
  if ('temperature' in weather) {
    if (typeof weather.temperature === 'object') {
      if (weather.temperature.min < 32 || weather.temperature.max > 95) return true;
    } else {
      if (weather.temperature < 32 || weather.temperature > 95) return true;
    }
  }
  
  return false;
};

const BasicUserWeatherWidget: React.FC<BasicUserWeatherWidgetProps> = ({ 
  currentWeather, 
  forecast, 
  alerts,
  zipCode 
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [showHourlyForecast, setShowHourlyForecast] = useState(false);
  
  if (!currentWeather) {
    return (
      <Card>
        <div className="flex flex-col h-full items-center justify-center py-8">
          <Cloud className="w-12 h-12 text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">
            Weather data unavailable
          </p>
        </div>
      </Card>
    );
  }
  
  // Check if there are any alerts
  const hasAlerts = alerts && alerts.length > 0;
  
  // Check if current conditions might impact work
  const currentImpactsWork = isWorkImpactingCondition(currentWeather);
  
  return (
    <div className="space-y-4">
      {/* Weather Alerts */}
      {hasAlerts && (
        <WeatherAlertBanner alerts={alerts} />
      )}
      
      {/* Current Weather Card */}
      <Card className={`${currentImpactsWork ? 'border-l-4 border-amber-500' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Current Weather</h3>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin size={14} className="mr-1" />
            <span>{zipCode}</span>
          </div>
        </div>
        
        {/* Current Weather */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <WeatherIcon 
              condition={currentWeather.condition} 
              className={`w-12 h-12 ${currentWeather.isRainy ? 'text-blue-500' : currentWeather.isSnowy ? 'text-indigo-400' : 'text-amber-500'}`} 
            />
            <div className="ml-3">
              <div className="text-2xl font-bold">{Math.round(currentWeather.temperature)}°F</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Feels like {Math.round(currentWeather.feelsLike)}°F
              </div>
            </div>
          </div>
          <div>
            <div className="text-right font-medium">{currentWeather.condition}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(new Date().toISOString())}
            </div>
          </div>
        </div>
        
        {/* Current Details */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Wind size={18} className={`${currentWeather.windSpeed > 20 ? 'text-amber-500' : 'text-gray-500 dark:text-gray-400'} mb-1`} />
            <span className="text-sm font-medium">{currentWeather.windSpeed} mph</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Wind</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <Droplets size={18} className="text-blue-500 dark:text-blue-400 mb-1" />
            <span className="text-sm font-medium">{currentWeather.humidity}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Humidity</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <CloudRain size={18} className={`${currentWeather.precipitation > 50 ? 'text-amber-500' : 'text-indigo-500 dark:text-indigo-400'} mb-1`} />
            <span className="text-sm font-medium">{currentWeather.precipitation}%</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Precip</span>
          </div>
        </div>
        
        {/* Work Impact Warning */}
        {currentImpactsWork && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Conditions may impact outdoor work</p>
              <p className="text-sm mt-1">
                {currentWeather.isRainy && 'Rain conditions. '}
                {currentWeather.isSnowy && 'Snow conditions. '}
                {currentWeather.windSpeed > 20 && `High winds (${currentWeather.windSpeed} mph). `}
                {currentWeather.temperature < 32 && 'Freezing temperatures. '}
                {currentWeather.temperature > 95 && 'Extreme heat. '}
                Check with your supervisor before proceeding with outdoor activities.
              </p>
            </div>
          </div>
        )}
        
        {/* Hourly Forecast Toggle */}
        <button 
          onClick={() => setShowHourlyForecast(!showHourlyForecast)}
          className="w-full flex items-center justify-between p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
        >
          <div className="flex items-center">
            <Clock size={16} className="mr-2" />
            <span>Hourly Forecast</span>
          </div>
          {showHourlyForecast ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {/* Hourly Forecast */}
        {showHourlyForecast && forecast.length > 0 && forecast[0].hourly && (
          <div className="mt-4">
            <HourlyForecastDisplay 
              hourlyData={forecast[0].hourly.slice(0, 24)} 
              thresholds={{
                rain: { enabled: true, thresholdPercentage: 50 },
                snow: { enabled: true, thresholdInches: 1 },
                wind: { enabled: true, thresholdMph: 20 },
                temperature: { enabled: true, thresholdFahrenheit: 32 }
              }}
            />
          </div>
        )}
      </Card>
      
      {/* 3-Day Forecast */}
      <Card>
        <h3 className="text-lg font-medium mb-4">3-Day Forecast</h3>
        <div className="space-y-4">
          {forecast.map((day, index) => {
            const impactsWork = isWorkImpactingCondition(day);
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-md ${impactsWork ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-gray-50 dark:bg-gray-800/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <WeatherIcon 
                      condition={day.condition} 
                      className={`w-8 h-8 ${
                        day.precipitation > 50 ? 'text-blue-500' : 
                        day.snowfall > 0 ? 'text-indigo-400' : 
                        'text-gray-500 dark:text-gray-400'
                      }`} 
                    />
                    <span className="ml-2 font-medium">
                      {formatDate(day.date)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {Math.round(day.temperature.min)}° / {Math.round(day.temperature.max)}°
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {day.condition}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="flex items-center text-sm">
                    <CloudRain size={14} className="mr-1 text-blue-500" />
                    <span>{day.precipitation}%</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Wind size={14} className="mr-1 text-gray-500" />
                    <span>{day.windSpeed} mph</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Droplets size={14} className="mr-1 text-blue-400" />
                    <span>{day.humidity}%</span>
                  </div>
                </div>
                
                {impactsWork && (
                  <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 flex items-center">
                    <AlertTriangle size={12} className="mr-1" />
                    <span>
                      {day.precipitation > 50 && 'High chance of rain. '}
                      {day.snowfall > 0 && `Snow expected (${day.snowfall}"). `}
                      {day.windSpeed > 20 && `High winds (${day.windSpeed} mph). `}
                      {day.temperature.min < 32 && 'Freezing temperatures. '}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default BasicUserWeatherWidget;
