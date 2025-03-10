// src/components/weather/HourlyForecastDisplay.tsx
import React, { useState } from 'react';
import { HourlyForecast } from '../../services/weatherService';
import { ChevronLeft, ChevronRight, Droplets, Thermometer, Wind } from 'lucide-react';

interface WeatherThresholds {
  rain?: { enabled: boolean; thresholdPercentage: number };
  snow?: { enabled: boolean; thresholdInches: number };
  wind?: { enabled: boolean; thresholdMph: number };
  temperature?: { enabled: boolean; thresholdFahrenheit: number };
}

interface HourlyForecastDisplayProps {
  hourlyData: HourlyForecast[];
  workingHoursOnly?: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  className?: string;
  thresholds?: WeatherThresholds;
}

const HourlyForecastDisplay: React.FC<HourlyForecastDisplayProps> = ({
  hourlyData,
  workingHoursOnly = false,
  workingHoursStart = '07:00',
  workingHoursEnd = '17:00',
  className = ''
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsToShow = 6; // Number of hours to show at once
  
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No hourly forecast data available
        </p>
      </div>
    );
  }
  
  // Filter for working hours if needed
  const filteredHourlyData = workingHoursOnly
    ? hourlyData.filter(hour => {
        const hourTime = new Date(hour.time);
        const hourString = hourTime.getHours().toString().padStart(2, '0') + ':00';
        return hourString >= workingHoursStart && hourString <= workingHoursEnd;
      })
    : hourlyData;
  
  // Calculate max items
  const maxStartIndex = Math.max(0, filteredHourlyData.length - itemsToShow);
  
  // Handle navigation
  const handlePrevious = () => {
    setStartIndex(Math.max(0, startIndex - itemsToShow));
  };
  
  const handleNext = () => {
    setStartIndex(Math.min(maxStartIndex, startIndex + itemsToShow));
  };
  
  // Get visible items
  const visibleItems = filteredHourlyData.slice(
    startIndex,
    Math.min(startIndex + itemsToShow, filteredHourlyData.length)
  );
  
  // Format time from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get condition color based on weather
  const getConditionColor = (hour: HourlyForecast) => {
    if (hour.willSnow) return 'text-blue-500 dark:text-blue-400';
    if (hour.willRain) return 'text-indigo-500 dark:text-indigo-400';
    if (hour.temp > 90) return 'text-red-500 dark:text-red-400';
    if (hour.temp < 32) return 'text-cyan-500 dark:text-cyan-400';
    return 'text-gray-700 dark:text-gray-300';
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Hourly Forecast
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            disabled={startIndex === 0}
            className={`p-1 rounded-full ${
              startIndex === 0
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Previous hours"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNext}
            disabled={startIndex >= maxStartIndex}
            className={`p-1 rounded-full ${
              startIndex >= maxStartIndex
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Next hours"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {visibleItems.map((hour, index) => (
          <div 
            key={index}
            className={`
              p-3 rounded-lg text-center
              ${hour.willRain || hour.willSnow 
                ? 'bg-blue-50 dark:bg-blue-900/20' 
                : 'bg-gray-50 dark:bg-gray-750'
              }
              ${hour.chanceOfRain > 50 || hour.chanceOfSnow > 50
                ? 'border border-blue-200 dark:border-blue-800'
                : ''
              }
            `}
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatTime(hour.time)}
            </p>
            
            <div className="my-2">
              <img 
                src={hour.icon} 
                alt={hour.condition}
                className="w-10 h-10 mx-auto"
              />
            </div>
            
            <p className={`text-lg font-semibold ${getConditionColor(hour)}`}>
              {Math.round(hour.temp)}°
            </p>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {hour.condition}
            </p>
            
            <div className="flex justify-center items-center space-x-2 mt-2">
              <div className="flex items-center" title="Precipitation">
                <Droplets className="w-3 h-3 text-blue-500 dark:text-blue-400 mr-1" />
                <span className="text-xs">{hour.chanceOfRain}%</span>
              </div>
              
              <div className="flex items-center" title="Wind Speed">
                <Wind className="w-3 h-3 text-gray-500 dark:text-gray-400 mr-1" />
                <span className="text-xs">{Math.round(hour.windSpeed)}mph</span>
              </div>
              
              <div className="flex items-center" title="Feels Like">
                <Thermometer className="w-3 h-3 text-red-500 dark:text-red-400 mr-1" />
                <span className="text-xs">{Math.round(hour.feelsLike)}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredHourlyData.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
          No hourly data available for the selected time range
        </p>
      )}
    </div>
  );
};

export default HourlyForecastDisplay;
