// src/services/firebaseWeatherService.ts
import axios from 'axios';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';

interface WeatherCondition {
  text: string;
  code: number;
  icon: string;
}

interface CurrentWeather {
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

interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  condition: string;
  precipitation: number;
  precipitationProbability: number;
  humidity: number;
  windSpeed: number;
  snowfall: number;
  icon: string;
}

/**
 * Fetches current weather for a specific zip code
 */
export async function getCurrentWeather(zipCode: string): Promise<CurrentWeather> {
  try {
    const response = await axios.get('/api/weather', {
      params: {
        zipCode,
        type: 'current',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw new Error('Failed to fetch current weather data');
  }
}

/**
 * Fetches weather forecast for a specific zip code and number of days
 */
export async function fetchWeatherForecast(zipCode: string, days: number = 7): Promise<ForecastDay[]> {
  try {
    const response = await axios.get('/api/weather', {
      params: {
        zipCode,
        days,
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw new Error('Failed to fetch weather forecast data');
  }
}

/**
 * Checks if weather conditions trigger an email notification
 */
export async function checkWeatherForNotifications(jobsiteId: string): Promise<{
  shouldSendNotification: boolean;
  conditions: string[];
  weatherDescription: string;
}> {
  try {
    // Get jobsite data
    const jobsiteRef = doc(db, 'jobsites', jobsiteId);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    const jobsite = jobsiteDoc.data();

    // Fetch weather data
    const forecast = await fetchWeatherForecast(jobsite.zip_code, 1);
    const currentWeather = await getCurrentWeather(jobsite.zip_code);
    const todayForecast = forecast[0];
    
    // Get alert thresholds from jobsite settings
    const thresholds = jobsite.weather_monitoring.alertThresholds;
    
    // Check conditions
    const triggeredConditions = [];
    
    if (thresholds.rain.enabled && todayForecast.precipitation >= thresholds.rain.thresholdPercentage) {
      triggeredConditions.push('rain');
    }
    
    if (thresholds.snow.enabled && todayForecast.snowfall >= thresholds.snow.thresholdInches) {
      triggeredConditions.push('snow');
    }
    
    if (thresholds.wind.enabled && todayForecast.windSpeed >= thresholds.wind.thresholdMph) {
      triggeredConditions.push('wind');
    }
    
    if (thresholds.temperature.enabled && todayForecast.temperature.min <= thresholds.temperature.thresholdFahrenheit) {
      triggeredConditions.push('temperature');
    }
    
    // Generate weather description using OpenAI
    let weatherDescription = '';
    if (triggeredConditions.length > 0) {
      const response = await axios.post('/api/weather-gpt', {
        currentWeather,
        forecast: todayForecast,
        triggeredConditions,
      });
      weatherDescription = response.data.weatherDescription;
    }
    
    // Log this check
    await addDoc(collection(db, 'weather_checks'), {
      jobsite_id: jobsiteId,
      conditions_checked: Object.keys(thresholds).filter(k => thresholds[k as keyof typeof thresholds].enabled),
      conditions_triggered: triggeredConditions,
      weather_data: {
        current: currentWeather,
        forecast: todayForecast,
      },
      notification_sent: triggeredConditions.length > 0,
      created_at: serverTimestamp(),
      user_id: auth.currentUser?.uid
    });
    
    return {
      shouldSendNotification: triggeredConditions.length > 0,
      conditions: triggeredConditions,
      weatherDescription,
    };
  } catch (error) {
    console.error('Error checking weather for notifications:', error);
    throw new Error('Failed to check weather conditions');
  }
}
