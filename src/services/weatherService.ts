// src/services/weatherService.ts
import { 
  WeatherWidgetForecast, 
  ForecastDay, 
  WeatherAlert, 
  CurrentWeather as WeatherCurrentWeather 
} from '../types/weather';

// Re-export types that are used by other components
export type { ForecastDay, WeatherAlert } from '../types/weather';

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
    // Get API key from environment variable using various approaches
    let apiKey;
    
    // Check for various ways the API key might be defined
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      apiKey = import.meta.env.VITE_WEATHER_API;
    } else if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    } else if (typeof window !== 'undefined' && (window as any).__ENV && (window as any).__ENV.VITE_WEATHER_API) {
      // Some applications put environment variables in a global __ENV object
      apiKey = (window as any).__ENV.VITE_WEATHER_API;
    }
    
    // Fallback to mock data in development if no API key
    if (!apiKey && process.env.NODE_ENV === 'development') {
      console.warn('No API key found in environment variables, using fallback mock data');
      return getMockWeatherData(location, days);
    }
    
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
      console.error(`Weather API returned ${response.status}: ${await response.text()}`);
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('API call failed, using fallback mock data');
        return getMockWeatherData(location, days);
      }
      throw new Error(`Weather API returned ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling Weather API directly:', error);
    // Fallback to mock data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('API call failed, using fallback mock data');
      return getMockWeatherData(location, days);
    }
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

/**
 * Generate mock weather data for development and testing
 */
function getMockWeatherData(location: string, days: number): any {
  const mockLocation = {
    name: location.includes(',') ? 'Custom Location' : location,
    region: 'Demo Region',
    country: 'Demo Country',
    lat: 38.9072,
    lon: -77.0369
  };
  
  const mockCurrent = {
    last_updated_epoch: Date.now() / 1000,
    last_updated: new Date().toISOString(),
    temp_c: 22,
    temp_f: 72,
    is_day: 1,
    condition: {
      text: 'Partly cloudy',
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
      code: 1003
    },
    wind_mph: 10,
    wind_kph: 16.1,
    wind_degree: 230,
    wind_dir: 'SW',
    pressure_mb: 1012,
    pressure_in: 29.88,
    precip_mm: 0,
    precip_in: 0,
    humidity: 65,
    cloud: 25,
    feelslike_c: 22,
    feelslike_f: 71.6,
    vis_km: 10,
    vis_miles: 6.2,
    uv: 5,
    gust_mph: 12.5,
    gust_kph: 20.2
  };
  
  const mockForecastDays = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const minTemp = 60 + Math.floor(Math.random() * 10);
    const maxTemp = minTemp + 5 + Math.floor(Math.random() * 10);
    const rainChance = Math.floor(Math.random() * 60);
    
    return {
      date: dateStr,
      date_epoch: date.getTime() / 1000,
      day: {
        maxtemp_c: (maxTemp - 32) * 5/9,
        maxtemp_f: maxTemp,
        mintemp_c: (minTemp - 32) * 5/9,
        mintemp_f: minTemp,
        avgtemp_c: ((minTemp + maxTemp) / 2 - 32) * 5/9,
        avgtemp_f: (minTemp + maxTemp) / 2,
        maxwind_mph: 10 + Math.floor(Math.random() * 10),
        maxwind_kph: (10 + Math.floor(Math.random() * 10)) * 1.6,
        totalprecip_mm: rainChance > 30 ? (Math.random() * 10) : 0,
        totalprecip_in: rainChance > 30 ? (Math.random() * 0.4) : 0,
        totalsnow_cm: 0,
        avgvis_km: 10,
        avgvis_miles: 6.2,
        avghumidity: 60 + Math.floor(Math.random() * 20),
        daily_will_it_rain: rainChance > 30 ? 1 : 0,
        daily_chance_of_rain: rainChance,
        daily_will_it_snow: 0,
        daily_chance_of_snow: 0,
        condition: {
          text: rainChance > 50 ? 'Light rain' : (rainChance > 30 ? 'Partly cloudy' : 'Sunny'),
          icon: rainChance > 50 ? '//cdn.weatherapi.com/weather/64x64/day/296.png' : 
               (rainChance > 30 ? '//cdn.weatherapi.com/weather/64x64/day/116.png' : '//cdn.weatherapi.com/weather/64x64/day/113.png'),
          code: rainChance > 50 ? 1183 : (rainChance > 30 ? 1003 : 1000)
        },
        uv: 5
      },
      astro: {
        sunrise: '06:30 AM',
        sunset: '07:30 PM',
        moonrise: '08:00 PM',
        moonset: '06:00 AM',
        moon_phase: 'Full Moon',
        moon_illumination: '100'
      },
      hour: Array.from({ length: 24 }, (_, j) => {
        const hourTime = new Date(date);
        hourTime.setHours(j);
        const hourRainChance = Math.floor(Math.random() * 60);
        const hourTemp = minTemp + Math.floor(Math.random() * (maxTemp - minTemp));
        
        return {
          time_epoch: hourTime.getTime() / 1000,
          time: hourTime.toISOString(),
          temp_c: (hourTemp - 32) * 5/9,
          temp_f: hourTemp,
          is_day: j >= 6 && j <= 18 ? 1 : 0,
          condition: {
            text: hourRainChance > 50 ? 'Light rain' : (hourRainChance > 30 ? 'Partly cloudy' : 'Sunny'),
            icon: hourRainChance > 50 ? '//cdn.weatherapi.com/weather/64x64/day/296.png' : 
                 (hourRainChance > 30 ? '//cdn.weatherapi.com/weather/64x64/day/116.png' : '//cdn.weatherapi.com/weather/64x64/day/113.png'),
            code: hourRainChance > 50 ? 1183 : (hourRainChance > 30 ? 1003 : 1000)
          },
          wind_mph: 5 + Math.floor(Math.random() * 15),
          wind_kph: (5 + Math.floor(Math.random() * 15)) * 1.6,
          wind_degree: 200 + Math.floor(Math.random() * 100),
          wind_dir: 'SW',
          pressure_mb: 1012,
          pressure_in: 29.88,
          precip_mm: hourRainChance > 30 ? (Math.random() * 2) : 0,
          precip_in: hourRainChance > 30 ? (Math.random() * 0.08) : 0,
          humidity: 60 + Math.floor(Math.random() * 20),
          cloud: hourRainChance > 30 ? (30 + Math.floor(Math.random() * 50)) : Math.floor(Math.random() * 30),
          feelslike_c: (hourTemp - 32) * 5/9,
          feelslike_f: hourTemp,
          windchill_c: (hourTemp - 32) * 5/9,
          windchill_f: hourTemp,
          heatindex_c: (hourTemp - 32) * 5/9,
          heatindex_f: hourTemp,
          dewpoint_c: ((60 + Math.floor(Math.random() * 10)) - 32) * 5/9,
          dewpoint_f: 60 + Math.floor(Math.random() * 10),
          will_it_rain: hourRainChance > 30 ? 1 : 0,
          chance_of_rain: hourRainChance,
          will_it_snow: 0,
          chance_of_snow: 0,
          vis_km: 10,
          vis_miles: 6.2,
          gust_mph: (5 + Math.floor(Math.random() * 15)) + 2,
          gust_kph: ((5 + Math.floor(Math.random() * 15)) + 2) * 1.6,
          uv: 5
        };
      })
    };
  });
  
  return {
    location: mockLocation,
    current: mockCurrent,
    forecast: {
      forecastday: mockForecastDays
    },
    alerts: {
      alert: []
    }
  };
}