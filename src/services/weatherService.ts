// src/services/weatherService.ts
import axios, { AxiosError } from 'axios';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  serverTimestamp,
  Timestamp,
  limit,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';
import { getIdToken } from 'firebase/auth';

// Types
export interface WeatherCondition {
  text: string;
  code: number;
  icon: string;
}

export interface WeatherLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  localtime: string;
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  precipitation: number;
  precipMm?: number;
  isRainy: boolean;
  isSnowy: boolean;
  isExtreme?: boolean;
  icon: string;
  location?: WeatherLocation;
}

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  conditionCode: number;
  windSpeed: number;
  precipMm: number;
  chanceOfRain: number;
  chanceOfSnow: number;
  willRain: boolean;
  willSnow: boolean;
  humidity: number;
  feelsLike: number;
  icon: string;
}

export interface WorkingHoursForecast {
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  maxWindSpeed: number;
  maxPrecipMm: number;
  precipProbability: number;
  willRain: boolean;
  willSnow: boolean;
  conditions: string[];
  conditionCodes: number[];
  hasSevereConditions: boolean;
}

export interface ForecastDay {
  date: string;
  dateEpoch?: number;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  condition: string;
  conditionCode?: number;
  precipitation: number;
  precipitationProbability?: number;
  totalPrecipIn?: number;
  totalPrecipMm?: number;
  humidity: number;
  windSpeed: number;
  windDirection?: string;
  snowfall: number;
  icon: string;
  sunrise?: string;
  sunset?: string;
  moonPhase?: string;
  workingHours?: WorkingHoursForecast;
  hourly?: HourlyForecast[];
}

export interface WeatherAlert {
  headline: string;
  severity: string;
  urgency: string;
  areas: string;
  category: string;
  event: string;
  effective: string;
  expires: string;
  desc: string;
}

export interface WeatherForecastResponse {
  forecast: ForecastDay[];
  location?: WeatherLocation;
  alerts?: WeatherAlert[];
}

// Cache for recent weather checks to reduce redundant API calls
const weatherCheckCache = new Map<string, {
  timestamp: number;
  data: {
    current: CurrentWeather;
    forecast: ForecastDay[];
    alerts?: WeatherAlert[];
    location?: WeatherLocation;
  }
}>();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_TTL_PRO = 15 * 60 * 1000; // 15 minutes for pro users (more frequent updates)
const API_TIMEOUT = 10000; // 10 seconds

/**
 * Gets the appropriate cache TTL based on user type
 * @param isPro Whether the user has pro features
 */
function getCacheTTL(isPro: boolean): number {
  return isPro ? CACHE_TTL_PRO : CACHE_TTL;
}

/**
 * Fetches current weather for a specific location
 * @param location Zip code, coordinates, or address
 * @param isPro Whether the user has pro features enabled
 * @param latitude Optional latitude for precise location
 * @param longitude Optional longitude for precise location
 */
export async function getCurrentWeather(
  location: string, 
  isPro: boolean = false,
  latitude?: number,
  longitude?: number
): Promise<CurrentWeather> {
  try {
    // Check cache first
    const cacheKey = `current_${location}_${latitude || ''}_${longitude || ''}`;
    const cachedData = weatherCheckCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < getCacheTTL(isPro)) {
      return cachedData.data.current;
    }
    
    const params: Record<string, string> = {
      location,
      type: 'current',
      isPro: isPro ? 'true' : 'false'
    };
    
    // Add coordinates for premium users if available
    if (isPro && latitude !== undefined && longitude !== undefined) {
      params.latitude = latitude.toString();
      params.longitude = longitude.toString();
    }
    
    const response = await axios.get('/api/consolidated/weather', {
      params,
      timeout: API_TIMEOUT
    });
    
    // Cache the result
    if (!weatherCheckCache.has(cacheKey)) {
      weatherCheckCache.set(cacheKey, {
        timestamp: Date.now(),
        data: {
          current: response.data,
          forecast: [], // Empty forecast for current-only cache
          location: response.data.location
        }
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Weather API request timed out. Please try again later.');
      }
      
      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data as any;
        
        throw new Error(errorData?.message || `Weather API error (${statusCode})`);
      }
    }
    
    throw new Error('Failed to fetch current weather data');
  }
}

/**
 * Fetches weather forecast for a specific location and number of days
 * @param location Zip code, coordinates, or address
 * @param days Number of days to forecast
 * @param isPro Whether the user has pro features enabled
 * @param options Additional options for the request
 */
export async function fetchWeatherForecast(
  location: string, 
  days: number = 3, // Default to 3 days for free tier
  isPro: boolean = false,
  options: { 
    latitude?: number,
    longitude?: number,
    aqi?: boolean,
    alerts?: boolean,
    cacheMinutes?: number // Allow custom cache duration
  } = {}
): Promise<WeatherForecastResponse> {
  try {
    // Ensure days is within free tier limits (max 3 days)
    const validDays = Math.min(days, 3);
    
    // Generate a more specific cache key based on options
    const cacheKey = `forecast_${location}_${validDays}_${options.latitude || ''}_${options.longitude || ''}_${options.aqi ? 'aqi' : 'no-aqi'}_${options.alerts ? 'alerts' : 'no-alerts'}`;
    const cachedData = weatherCheckCache.get(cacheKey);
    
    // Use custom cache duration or default
    const cacheDuration = options.cacheMinutes 
      ? options.cacheMinutes * 60 * 1000 // Convert minutes to milliseconds
      : getCacheTTL(isPro);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < cacheDuration) {
      return {
        forecast: cachedData.data.forecast,
        location: cachedData.data.location,
        alerts: cachedData.data.alerts
      };
    }
    
    const params: Record<string, string> = {
      location,
      days: validDays.toString(),
      isPro: isPro ? 'true' : 'false'
    };
    
    // Add optional parameters
    if (options.latitude !== undefined) params.latitude = options.latitude.toString();
    if (options.longitude !== undefined) params.longitude = options.longitude.toString();
    if (options.aqi) params.aqi = 'yes';
    if (options.alerts) params.alerts = 'yes';
    
    // Implement retry logic with exponential backoff
    let retries = 0;
    const maxRetries = 3;
    
    while (retries <= maxRetries) {
      try {
        const response = await axios.get('/api/consolidated/weather', {
          params,
          timeout: API_TIMEOUT + (retries * 1000) // Increase timeout with each retry
        });
        
        // Cache the result
        weatherCheckCache.set(cacheKey, {
          timestamp: Date.now(),
          data: {
            current: {} as CurrentWeather, // Empty current for forecast-only cache
            forecast: response.data.forecast,
            location: response.data.location,
            alerts: response.data.alerts
          }
        });
        
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          
          // Don't retry for certain error types
          if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
            throw error; // Don't retry client errors (4xx)
          }
        }
        
        retries++;
        if (retries > maxRetries) throw error;
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    throw new Error('Maximum retries exceeded');
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Weather API request timed out. Please try again later.');
      }
      
      if (axiosError.response) {
        const statusCode = axiosError.response.status;
        const errorData = axiosError.response.data as any;
        
        throw new Error(errorData?.message || `Weather API error (${statusCode})`);
      }
    }
    
    throw new Error('Failed to fetch weather forecast data');
  }
}

/**
 * Checks if a recent weather check exists for a location
 * @param location Location to check
 * @param maxAgeMinutes Maximum age in minutes to consider recent
 */
export async function hasRecentWeatherCheck(location: string, maxAgeMinutes: number = 60): Promise<boolean> {
  try {
    const recentChecksQuery = query(
      collection(db, 'weather_checks'),
      where('location', '==', location),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(recentChecksQuery);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const lastCheck = querySnapshot.docs[0].data();
    const lastCheckTime = (lastCheck.created_at as Timestamp).toDate();
    const ageInMinutes = (Date.now() - lastCheckTime.getTime()) / (1000 * 60);
    
    return ageInMinutes <= maxAgeMinutes;
  } catch (error) {
    console.error('Error checking recent weather checks:', error);
    return false; // Assume no recent check on error
  }
}

/**
 * Checks if weather conditions trigger an email notification
 */
export async function checkWeatherForNotifications(jobsiteId: string): Promise<{
  shouldSendNotification: boolean;
  conditions: string[];
  weatherDescription: string;
  weatherData?: {
    current: CurrentWeather;
    forecast: ForecastDay;
  };
}> {
  try {
    // Get jobsite data
    const jobsiteRef = doc(db, 'jobsites', jobsiteId);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    const jobsite = jobsiteDoc.data();
    const isPro = jobsite.subscription_tier === 'pro';
    const location = jobsite.zip_code || jobsite.address;
    
    if (!location) {
      throw new Error('Jobsite has no location information');
    }

    // Check if we have a recent check for this location
    const hasRecent = await hasRecentWeatherCheck(location);
    
    // If we have a recent check and it's not a pro user, use cached data if available
    let forecastResponse: WeatherForecastResponse;
    let currentWeather: CurrentWeather;
    
    if (hasRecent && !isPro) {
      // Try to get from cache first
      const forecastCacheKey = `forecast_${location}_1`;
      const currentCacheKey = `current_${location}`;
      
      const forecastCache = weatherCheckCache.get(forecastCacheKey);
      const currentCache = weatherCheckCache.get(currentCacheKey);
      
      if (forecastCache && currentCache && 
          (Date.now() - forecastCache.timestamp) < getCacheTTL(isPro) &&
          (Date.now() - currentCache.timestamp) < getCacheTTL(isPro)) {
        forecastResponse = { 
          forecast: forecastCache.data.forecast,
          location: forecastCache.data.location,
          alerts: forecastCache.data.alerts
        };
        currentWeather = currentCache.data.current;
      } else {
        // Fetch new data
        [forecastResponse, currentWeather] = await Promise.all([
          fetchWeatherForecast(location, 1, isPro, { alerts: true }),
          getCurrentWeather(location, isPro)
        ]);
      }
    } else {
      // Always fetch fresh data for pro users or if no recent check
      // Use coordinates for premium users if available
      const jobsiteHasCoordinates = jobsite.latitude !== undefined && 
                                   jobsite.latitude !== null && 
                                   jobsite.longitude !== undefined && 
                                   jobsite.longitude !== null;
      
      [forecastResponse, currentWeather] = await Promise.all([
        fetchWeatherForecast(
          location, 
          1, 
          isPro, 
          {
            latitude: jobsiteHasCoordinates ? jobsite.latitude : undefined,
            longitude: jobsiteHasCoordinates ? jobsite.longitude : undefined,
            alerts: true
          }
        ),
        getCurrentWeather(
          location, 
          isPro,
          jobsiteHasCoordinates ? jobsite.latitude : undefined,
          jobsiteHasCoordinates ? jobsite.longitude : undefined
        )
      ]);
    }
    
    const todayForecast = forecastResponse.forecast[0];
    const alerts = forecastResponse.alerts || [];
    
    // Get alert thresholds from jobsite settings
    const thresholds = jobsite.weather_monitoring.alertThresholds;
    
    // Check conditions
    const triggeredConditions = [];
    
    // Check for weather alerts first (pro feature)
    if (isPro && alerts.length > 0) {
      triggeredConditions.push('weather_alert');
    }
    
    // Check rain conditions
    if (thresholds.rain.enabled) {
      // For pro users, check hourly data for more precise rain prediction
      if (isPro && todayForecast.workingHours) {
        if (todayForecast.workingHours.willRain || 
            todayForecast.workingHours.precipProbability >= thresholds.rain.thresholdPercentage) {
          triggeredConditions.push('rain');
        }
      } else if (todayForecast.precipitation >= thresholds.rain.thresholdPercentage) {
        triggeredConditions.push('rain');
      }
    }
    
    // Check for any rain (even small amounts)
    if (thresholds.anyRain && thresholds.anyRain.enabled) {
      const totalPrecipMm = todayForecast.totalPrecipMm || 0;
      const thresholdInches = thresholds.anyRain.thresholdInches || 0.01;
      const thresholdMm = thresholdInches * 25.4; // Convert inches to mm
      
      if (totalPrecipMm >= thresholdMm) {
        triggeredConditions.push('any_rain');
      }
    }
    
    // Check snow conditions
    if (thresholds.snow.enabled && todayForecast.snowfall >= thresholds.snow.thresholdInches) {
      triggeredConditions.push('snow');
    }
    
    // Check wind conditions
    if (thresholds.wind.enabled) {
      // For pro users, check hourly data for more precise wind prediction
      if (isPro && todayForecast.workingHours) {
        if (todayForecast.workingHours.maxWindSpeed >= thresholds.wind.thresholdMph) {
          triggeredConditions.push('wind');
        }
      } else if (todayForecast.windSpeed >= thresholds.wind.thresholdMph) {
        triggeredConditions.push('wind');
      }
    }
    
    // Check temperature conditions
    if (thresholds.temperature.enabled && todayForecast.temperature.min <= thresholds.temperature.thresholdFahrenheit) {
      triggeredConditions.push('temperature');
    }
    
    // Check for extreme conditions (pro feature)
    if (isPro && todayForecast.workingHours && todayForecast.workingHours.hasSevereConditions) {
      triggeredConditions.push('extreme_conditions');
    }
    
    // Generate weather description using OpenAI
    let weatherDescription = '';
    if (triggeredConditions.length > 0) {
      try {
        // Get auth token for API call
        const idToken = auth.currentUser ? await getIdToken(auth.currentUser) : null;
        
        if (!idToken) {
          throw new Error('User not authenticated');
        }
        
        const response = await axios.post('/api/consolidated/weather/gpt', 
          {
            currentWeather,
            forecast: todayForecast,
            triggeredConditions,
          },
          {
            headers: {
              'Authorization': `Bearer ${idToken}`
            },
            timeout: 20000 // Longer timeout for GPT
          }
        );
        
        weatherDescription = response.data.weatherDescription;
      } catch (error) {
        console.error('Error generating weather description:', error);
        
        // Fallback description
        const conditions = triggeredConditions.join(' and ');
        weatherDescription = `Due to ${conditions} conditions, outdoor work may be challenging today. Please use caution and follow safety protocols.`;
      }
    }
    
    // Log this check
    await addDoc(collection(db, 'weather_checks'), {
      jobsite_id: jobsiteId,
      location: location,
      conditions_checked: Object.keys(thresholds).filter(k => thresholds[k as keyof typeof thresholds].enabled),
      conditions_triggered: triggeredConditions,
      weather_data: {
        current: currentWeather,
        forecast: todayForecast,
        alerts: alerts.length > 0 ? alerts : null
      },
      notification_sent: triggeredConditions.length > 0,
      created_at: serverTimestamp(),
      user_id: auth.currentUser?.uid
    });
    
    return {
      shouldSendNotification: triggeredConditions.length > 0,
      conditions: triggeredConditions,
      weatherDescription,
      weatherData: {
        current: currentWeather,
        forecast: todayForecast
      }
    };
  } catch (error) {
    console.error('Error checking weather for notifications:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to check weather conditions: ${error.message}`);
    }
    
    throw new Error('Failed to check weather conditions');
  }
}
