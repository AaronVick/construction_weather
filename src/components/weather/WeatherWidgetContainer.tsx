// src/components/weather/WeatherWidgetContainer.tsx
import React, { useState, useEffect } from 'react';
import { getCurrentWeather, fetchWeatherForecast } from '../../services/weatherService';
import { transformForecastForWidget } from '../../utils/weatherTransforms';
import WeatherWidget from './WeatherWidget';
import { CurrentWeather, WeatherWidgetForecast } from '../../types/weather';

interface WeatherWidgetContainerProps {
  zipCode: string;
  className?: string;
  onWeatherUpdate?: (weather: {
    current: CurrentWeather | null;
    forecast: WeatherWidgetForecast[];
  }) => React.ReactNode;
}

const WeatherWidgetContainer: React.FC<WeatherWidgetContainerProps> = ({ 
  zipCode,
  className,
  onWeatherUpdate 
}) => {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherWidgetForecast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);
        
        const [currentWeather, forecastData] = await Promise.all([
          getCurrentWeather(zipCode),
          fetchWeatherForecast(zipCode, 3)
        ]);
        
        setCurrent(currentWeather);
        const transformedForecast = transformForecastForWidget(forecastData);
        setForecast(transformedForecast);

        // Call onWeatherUpdate if provided
        if (onWeatherUpdate) {
          onWeatherUpdate({
            current: currentWeather,
            forecast: transformedForecast
          });
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather data');
      } finally {
        setLoading(false);
      }
    }
    
    if (zipCode) {
      fetchWeather();
    }
  }, [zipCode, onWeatherUpdate]);

  if (error) {
    return (
      <div className={`text-red-500 p-4 ${className || ''}`}>
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <WeatherWidget 
        current={current}
        forecast={forecast}
        zipCode={zipCode}
      />
    </div>
  );
};

export default WeatherWidgetContainer;