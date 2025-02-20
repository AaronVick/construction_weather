// src/services/weatherService.ts
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.weatherapi.com/v1';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

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
    const response = await axios.get(`${WEATHER_API_URL}/current.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: zipCode,
        aqi: 'no',
      },
    });

    const data = response.data;
    const current = data.current;
    const condition: WeatherCondition = current.condition;

    const isRainy = checkIfRainy(condition.code, current.precip_mm);
    const isSnowy = checkIfSnowy(condition.code);

    return {
      temperature: current.temp_f,
      feelsLike: current.feelslike_f,
      condition: condition.text,
      humidity: current.humidity,
      windSpeed: current.wind_mph,
      precipitation: current.precip_in > 0 ? 100 : current.humidity > 80 ? 60 : 0,
      isRainy,
      isSnowy,
      icon: condition.icon,
    };
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
    const response = await axios.get(`${WEATHER_API_URL}/forecast.json`, {
      params: {
        key: WEATHER_API_KEY,
        q: zipCode,
        days,
        aqi: 'no',
        alerts: 'yes',
      },
    });

    const forecastDays = response.data.forecast.forecastday;
    
    return forecastDays.map((day: any) => {
      const condition: WeatherCondition = day.day.condition;
      
      return {
        date: day.date,
        temperature: {
          min: day.day.mintemp_f,
          max: day.day.maxtemp_f,
          avg: day.day.avgtemp_f,
        },
        condition: condition.text,
        precipitation: day.day.daily_chance_of_rain,
        precipitationProbability: Math.max(day.day.daily_chance_of_rain, day.day.daily_chance_of_snow),
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_mph,
        snowfall: day.day.daily_chance_of_snow > 0 ? (day.day.totalsnow_cm / 2.54) : 0,
        icon: condition.icon,
      };
    });
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
    const { data: jobsite, error: jobsiteError } = await supabase
      .from('jobsites')
      .select('*')
      .eq('id', jobsiteId)
      .single();

    if (jobsiteError) throw jobsiteError;
    if (!jobsite) throw new Error('Jobsite not found');

    // Fetch weather data
    const forecast = await fetchWeatherForecast(jobsite.zipCode, 1);
    const currentWeather = await getCurrentWeather(jobsite.zipCode);
    const todayForecast = forecast[0];
    
    // Get alert thresholds from jobsite settings
    const thresholds = jobsite.weatherMonitoring.alertThresholds;
    
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
      weatherDescription = await generateWeatherDescription(currentWeather, todayForecast, triggeredConditions);
    }
    
    // Log this check
    await supabase.from('weather_checks').insert({
      jobsite_id: jobsiteId,
      conditions_checked: Object.keys(thresholds).filter(k => thresholds[k as keyof typeof thresholds].enabled),
      conditions_triggered: triggeredConditions,
      weather_data: {
        current: currentWeather,
        forecast: todayForecast,
      },
      notification_sent: triggeredConditions.length > 0,
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

/**
 * Generates a weather description using OpenAI
 */
async function generateWeatherDescription(
  currentWeather: CurrentWeather,
  forecast: ForecastDay,
  triggeredConditions: string[]
): Promise<string> {
  try {
    const prompt = `
      You are a helpful assistant that provides clear and professional weather notifications for construction crews.
      
      Current weather conditions:
      - Temperature: ${currentWeather.temperature}°F (feels like ${currentWeather.feelsLike}°F)
      - Condition: ${currentWeather.condition}
      - Humidity: ${currentWeather.humidity}%
      - Wind speed: ${currentWeather.windSpeed} mph
      - Precipitation: ${currentWeather.precipitation}%
      
      Forecast for today:
      - Temperature range: ${forecast.temperature.min}°F to ${forecast.temperature.max}°F
      - Condition: ${forecast.condition}
      - Chance of rain: ${forecast.precipitation}%
      - Chance of snow: ${forecast.snowfall > 0 ? 'Yes' : 'No'}
      - Wind speed: ${forecast.windSpeed} mph
      
      The following weather conditions have triggered an alert: ${triggeredConditions.join(', ')}.
      
      Please provide a concise, 2-3 sentence professional weather description explaining why outdoor work might be unsafe or challenging today. 
      Focus specifically on the triggered conditions. Be factual and avoid being alarmist. Don't mention construction specifically - this is for all outdoor work.
    `;

    const response = await axios.post(
      `${OPENAI_API_URL}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional weather reporter providing concise and factual information.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating weather description:', error);
    
    // Fallback description if API call fails
    const conditions = triggeredConditions.join(' and ');
    return `Due to ${conditions} conditions, outdoor work may be challenging today. Please use caution and follow safety protocols.`;
  }
}

// Helper functions to interpret weather condition codes
function checkIfRainy(conditionCode: number, precipMm: number): boolean {
  // Weather condition codes that indicate rain
  const rainCodes = [
    1063, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 
    1240, 1243, 1246, 1273, 1276
  ];
  
  return rainCodes.includes(conditionCode) || precipMm > 0;
}

function checkIfSnowy(conditionCode: number): boolean {
  // Weather condition codes that indicate snow
  const snowCodes = [
    1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 
    1255, 1258, 1279, 1282
  ];
  
  return snowCodes.includes(conditionCode);
}