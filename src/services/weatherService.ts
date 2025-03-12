// src/services/weatherService.ts
import { 
  WeatherWidgetForecast, 
  ForecastDay, 
  WeatherAlert, 
  CurrentWeather as WeatherCurrentWeather 
} from '../types/weather';

// Types
export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isRainy: boolean;
  isSnowy: boolean;
  icon: string;
}

export interface WeatherData {
  current: CurrentWeather | null;
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
  location: {
    name: string;
    region: string;
    country: string;
  };
}

/**
 * Fetches current weather data for a location
 * @param location Zipcode, city name, or coordinates
 * @param includeAlerts Whether to include weather alerts
 * @param latitude Optional latitude if using coordinates
 * @param longitude Optional longitude if using coordinates
 */
export async function getCurrentWeather(
  location: string,
  includeAlerts: boolean = false,
  latitude?: number,
  longitude?: number
): Promise<CurrentWeather | null> {
  try {
    const weatherData = await fetchWeatherApiData(location, 1, includeAlerts, latitude, longitude);
    if (!weatherData || !weatherData.current) return null;
    
    return transformCurrentWeather(weatherData);
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return null;
  }
}

/**
 * Fetches weather forecast data for a location
 * @param location Zipcode, city name, or coordinates
 * @param days Number of days to forecast (1-10)
 * @param includeAlerts Whether to include weather alerts
 * @param options Additional options like coordinates
 */
export async function fetchWeatherForecast(
  location: string,
  days: number = 3,
  includeAlerts: boolean = false,
  options: {
    latitude?: number;
    longitude?: number;
  } = {}
): Promise<{ forecast: ForecastDay[]; alerts: WeatherAlert[] }> {
  try {
    const weatherData = await fetchWeatherApiData(
      location,
      days,
      includeAlerts,
      options.latitude,
      options.longitude
    );
    
    if (!weatherData || !weatherData.forecast) {
      return { forecast: [], alerts: [] };
    }
    
    const forecast = transformForecastDays(weatherData);
    const alerts = transformWeatherAlerts(weatherData);
    
    return { forecast, alerts };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return { forecast: [], alerts: [] };
  }
}

/**
 * Fetches complete weather data including current conditions, forecast, and alerts
 * @param location Zipcode, city name, or coordinates
 * @param days Number of days to forecast (1-10)
 * @param options Additional options like coordinates
 */
export async function fetchCompleteWeatherData(
  location: string,
  days: number = 5,
  options: {
    latitude?: number;
    longitude?: number;
  } = {}
): Promise<WeatherData> {
  try {
    const weatherData = await fetchWeatherApiData(
      location,
      days,
      true, // Always include alerts for complete data
      options.latitude,
      options.longitude
    );
    
    if (!weatherData) {
      return {
        current: null,
        forecast: [],
        alerts: [],
        location: { name: '', region: '', country: '' }
      };
    }
    
    const current = transformCurrentWeather(weatherData);
    const forecast = transformForecastDays(weatherData);
    const alerts = transformWeatherAlerts(weatherData);
    
    return {
      current,
      forecast,
      alerts,
      location: {
        name: weatherData.location?.name || '',
        region: weatherData.location?.region || '',
        country: weatherData.location?.country || ''
      }
    };
  } catch (error) {
    console.error('Error fetching complete weather data:', error);
    return {
      current: null,
      forecast: [],
      alerts: [],
      location: { name: '', region: '', country: '' }
    };
  }
}

/**
 * Core function to fetch data from Weather API with fallbacks
 */
async function fetchWeatherApiData(
  location: string,
  days: number = 1,
  includeAlerts: boolean = false,
  latitude?: number,
  longitude?: number
): Promise<any> {
  // First try the application API endpoint if it exists
  try {
    let apiUrl = `/api/weather?location=${encodeURIComponent(location)}&days=${days}`;
    
    if (includeAlerts) {
      apiUrl += '&alerts=yes';
    }
    
    if (latitude !== undefined && longitude !== undefined) {
      apiUrl += `&lat=${latitude}&lon=${longitude}`;
    }
    
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error calling application weather API endpoint:', error);
    // Continue to direct API fallback
  }
  
  // Fallback to direct Weather API call
  try {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_WEATHER_API || process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error('Weather API key is not available');
    }
    
    // Determine query parameter
    let query = location;
    if (latitude !== undefined && longitude !== undefined) {
      query = `${latitude},${longitude}`;
    }
    
    const apiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=${days}&aqi=no&alerts=${includeAlerts ? 'yes' : 'no'}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}: ${await response.text()}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Weather API directly:', error);
    throw error; // Re-throw to let caller handle it
  }
}

/**
 * Transform API response to CurrentWeather format
 */
function transformCurrentWeather(data: any): CurrentWeather {
  if (!data.current) {
    throw new Error('Invalid weather data format: missing current data');
  }
  
  return {
    temperature: Math.round(data.current.temp_f),
    feelsLike: Math.round(data.current.feelslike_f),
    condition: data.current.condition.text,
    humidity: data.current.humidity,
    windSpeed: data.current.wind_mph,
    precipitation: data.current.precip_in > 0 ? data.current.precip_in : 
                  data.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain || 0,
    isRainy: data.current.precip_in > 0 || 
            (data.current.condition.text.toLowerCase().includes('rain') && 
             data.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain > 20),
    isSnowy: data.current.condition.text.toLowerCase().includes('snow') || 
            (data.forecast?.forecastday?.[0]?.day?.totalsnow_cm > 0),
    icon: data.current.condition.icon
  };
}

/**
 * Transform API response to ForecastDay array
 */
function transformForecastDays(data: any): ForecastDay[] {
  if (!data.forecast || !data.forecast.forecastday || !Array.isArray(data.forecast.forecastday)) {
    return [];
  }
  
  return data.forecast.forecastday.map((day: any): ForecastDay => ({
    date: day.date,
    temperature: {
      min: Math.round(day.day.mintemp_f),
      max: Math.round(day.day.maxtemp_f)
    },
    condition: day.day.condition.text,
    precipitation: day.day.daily_chance_of_rain,
    humidity: day.day.avghumidity,
    windSpeed: day.day.maxwind_mph,
    snowfall: day.day.totalsnow_cm > 0 ? day.day.totalsnow_cm / 2.54 : 0, // Convert cm to inches
    icon: day.day.condition.icon,
    hourly: day.hour // Include hourly data if needed by components
  }));
}

/**
 * Transform API response to WeatherAlert array
 */
function transformWeatherAlerts(data: any): WeatherAlert[] {
  if (!data.alerts || !data.alerts.alert || !Array.isArray(data.alerts.alert)) {
    return [];
  }
  
  return data.alerts.alert.map((alert: any): WeatherAlert => ({
    headline: alert.headline || alert.event || 'Weather Alert',
    severity: alert.severity || 'Unknown',
    event: alert.event || 'Weather Alert',
    effective: alert.effective || new Date().toISOString(),
    expires: alert.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    description: alert.desc || alert.description || 'No details available'
  }));
}

/**
 * Transform weather data for the WeatherWidget component
 */
export interface WeatherForecastResponse {
  forecast: ForecastDay[];
  alerts: WeatherAlert[];
}

export interface HourlyForecast {
  time: string;
  temp: number;
  feelsLike: number;
  condition: string;
  chanceOfRain: number;
  chanceOfSnow: number;
  windSpeed: number;
  willRain: boolean;
  willSnow: boolean;
  icon: string;
}

export interface WeatherNotificationCheckResult {
  shouldSendNotification: boolean;
  conditions: string[];
  weatherDescription: string;
  weatherData?: {
    current?: CurrentWeather | null;
    forecast?: ForecastDay | null;
    precipitationProbability?: number;
    windSpeed?: number;
  };
}

/**
 * Checks weather conditions for a jobsite and determines if notifications should be sent
 * @param jobsiteId The ID of the jobsite to check
 * @returns Result object with notification status and weather data
 */
export async function checkWeatherForNotifications(jobsiteId: string): Promise<WeatherNotificationCheckResult> {
  try {
    // In a real implementation, we would:
    // 1. Get the jobsite data from Firestore
    // 2. Get the jobsite's location (zip code, coordinates)
    // 3. Get the jobsite's weather settings and thresholds
    // 4. Fetch weather data for the location
    // 5. Check if any thresholds are exceeded
    // 6. Return the result

    // For now, we'll return a placeholder implementation
    return {
      shouldSendNotification: false,
      conditions: [],
      weatherDescription: "Weather conditions normal",
      weatherData: {
        current: null,
        forecast: null,
        precipitationProbability: 0,
        windSpeed: 0
      }
    };
  } catch (error) {
    console.error(`Error checking weather for notifications (jobsite ${jobsiteId}):`, error);
    throw error;
  }
}

export function transformForWeatherWidget(data: any): {
  current: CurrentWeather | null;
  forecast: WeatherWidgetForecast[];
} {
  let current: CurrentWeather | null = null;
  let forecast: WeatherWidgetForecast[] = [];
  
  if (data.current) {
    current = transformCurrentWeather(data);
  }
  
  if (data.forecast && data.forecast.forecastday) {
    forecast = data.forecast.forecastday.map((day: any): WeatherWidgetForecast => ({
      date: day.date,
      temperature: {
        min: Math.round(day.day.mintemp_f),
        max: Math.round(day.day.maxtemp_f)
      },
      condition: day.day.condition.text,
      precipitation: day.day.daily_chance_of_rain / 100, // Convert percentage to decimal
      icon: day.day.condition.icon
    }));
  }
  
  return { current, forecast };
}
