// src/components/weather/WeatherWidgetContainer.tsx
import React, { useState, useEffect } from 'react';
import { getCurrentWeather, fetchWeatherForecast, WeatherForecastResponse } from '../../services/weatherService';
import { transformForecastForWidget } from '../../utils/weatherTransforms';
import WeatherWidget from './WeatherWidget';
import { CurrentWeather, WeatherWidgetForecast } from '../../types/weather';
import { useSubscription } from '../../hooks/useSubscription';

interface WeatherWidgetContainerProps {
  location: string; // Can be zipCode, coordinates, or address
  className?: string;
  latitude?: number; // Optional latitude for precise location
  longitude?: number; // Optional longitude for precise location
  onWeatherUpdate?: (weather: {
    current: CurrentWeather | null;
    forecast: WeatherWidgetForecast[];
    alerts?: any[];
  }) => React.ReactNode;
}

const WeatherWidgetContainer: React.FC<WeatherWidgetContainerProps> = ({ 
  location,
  className,
  latitude,
  longitude,
  onWeatherUpdate 
}) => {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<WeatherWidgetForecast[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const { subscription } = useSubscription();
  const isPro = subscription?.plan === 'premium' || subscription?.plan === 'enterprise';

  useEffect(() => {
    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current weather and forecast in parallel
        const [currentWeather, forecastResponse] = await Promise.all([
          getCurrentWeather(location, isPro, latitude, longitude),
          fetchWeatherForecast(location, 3, isPro, {
            latitude,
            longitude
          })
        ]);
        
        setCurrent(currentWeather);
        
        // Extract forecast and alerts from response
        const forecastData = forecastResponse.forecast || [];
        const alertsData = forecastResponse.alerts || [];
        
        const transformedForecast = transformForecastForWidget(forecastData);
        setForecast(transformedForecast);
        setAlerts(alertsData);

        // Call onWeatherUpdate if provided
        if (onWeatherUpdate) {
          onWeatherUpdate({
            current: currentWeather,
            forecast: transformedForecast,
            alerts: alertsData
          });
        }
      } catch (err) {
        console.error('Error fetching weather data:', err);
        
        // Provide more specific error message if available
        let errorMessage = 'Failed to load weather data';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
        
        // Retry up to 2 times with exponential backoff
        if (retryCount < 2) {
          const timeout = Math.pow(2, retryCount) * 1000;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, timeout);
        }
      } finally {
        setLoading(false);
      }
    }
    
    if (location) {
      fetchWeather();
    } else {
      setError('No location provided');
      setLoading(false);
    }
  }, [location, onWeatherUpdate, retryCount, isPro]);

  if (error) {
    return (
      <div className={`text-red-500 p-4 ${className || ''}`}>
        <p>{error}</p>
        {retryCount < 2 && loading && (
          <p className="text-sm mt-2">Retrying...</p>
        )}
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
        zipCode={location}
        current={current}
        forecast={forecast}
        showRefresh={false}
      />
    </div>
  );
};

export default WeatherWidgetContainer;
