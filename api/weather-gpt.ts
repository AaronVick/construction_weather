// api/weather-gpt.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios, { AxiosError } from 'axios';
import { auth } from '../src/lib/firebaseAdmin';
import NodeCache from 'node-cache';

// Cache for storing generated descriptions to reduce API calls
const descriptionCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 }); // Cache for 1 hour
const API_TIMEOUT = 15000; // 15 seconds timeout for OpenAI API

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionCode?: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  isRainy?: boolean;
  isSnowy?: boolean;
  isExtreme?: boolean;
  icon?: string;
}

interface ForecastDay {
  date: string;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  condition: string;
  conditionCode?: number;
  precipitation: number;
  precipitationProbability?: number;
  humidity: number;
  windSpeed: number;
  snowfall: number;
  workingHours?: any;
  hourly?: any[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Verify the token
      await auth.verifyIdToken(token);
    } catch (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ 
        message: 'Invalid authentication token',
        error: 'auth_error'
      });
    }

    const { currentWeather, forecast, triggeredConditions } = req.body;

    if (!currentWeather || !forecast || !triggeredConditions || !Array.isArray(triggeredConditions)) {
      return res.status(400).json({ 
        message: 'Missing or invalid required data',
        details: {
          currentWeather: !currentWeather ? 'missing' : 'provided',
          forecast: !forecast ? 'missing' : 'provided',
          triggeredConditions: !triggeredConditions ? 'missing' : 
                              !Array.isArray(triggeredConditions) ? 'not an array' : 'provided'
        }
      });
    }

    // Generate cache key based on weather data and conditions
    const cacheKey = `weather_desc_${JSON.stringify(triggeredConditions)}_${currentWeather.condition}_${forecast.condition}`;
    
    // Check if we have cached description
    const cachedDescription = descriptionCache.get(cacheKey);
    if (cachedDescription) {
      return res.status(200).json({ weatherDescription: cachedDescription });
    }

    const weatherDescription = await generateWeatherDescription(
      currentWeather,
      forecast,
      triggeredConditions
    );

    // Cache the result
    descriptionCache.set(cacheKey, weatherDescription);
    return res.status(200).json({ weatherDescription });
  } catch (error) {
    console.error('Error generating weather description:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.code === 'ECONNABORTED') {
        return res.status(504).json({ 
          message: 'OpenAI API request timed out',
          error: 'timeout_error'
        });
      }
      
      if (axiosError.response) {
        return res.status(axiosError.response.status).json({ 
          message: 'Error from OpenAI API',
          error: 'openai_error',
          details: axiosError.response.data
        });
      }
    }
    
    return res.status(500).json({ 
      message: 'Failed to generate weather description',
      error: 'internal_error'
    });
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
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_API_URL = 'https://api.openai.com/v1';

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    // Include working hours analysis if available
    const workingHoursInfo = forecast.workingHours ? `
      Working hours forecast (6am-6pm):
      - Average temperature: ${Math.round(forecast.workingHours.avgTemp)}°F
      - Wind speed up to: ${forecast.workingHours.maxWindSpeed} mph
      - Precipitation probability: ${forecast.workingHours.precipProbability}%
      - Will it rain: ${forecast.workingHours.willRain ? 'Yes' : 'No'}
      - Will it snow: ${forecast.workingHours.willSnow ? 'Yes' : 'No'}
      - Conditions: ${forecast.workingHours.conditions.join(', ')}
    ` : '';

    // Include hourly analysis for specific times if available
    const morningConditions = forecast.hourly && forecast.hourly.length >= 9 ? 
      `Morning conditions (9am): ${forecast.hourly[9].condition}, ${Math.round(forecast.hourly[9].temp)}°F` : '';
    
    const noonConditions = forecast.hourly && forecast.hourly.length >= 12 ? 
      `Noon conditions (12pm): ${forecast.hourly[12].condition}, ${Math.round(forecast.hourly[12].temp)}°F` : '';

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
      ${workingHoursInfo}
      ${morningConditions ? morningConditions : ''}
      ${noonConditions ? noonConditions : ''}
      
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
        timeout: API_TIMEOUT
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating weather description:', error);
    
    // More detailed fallback description based on triggered conditions
    let fallbackDescription = '';
    
    if (triggeredConditions.includes('rain')) {
      fallbackDescription += `Rain conditions with ${forecast.precipitation}% chance of precipitation may impact outdoor activities. `;
    }
    
    if (triggeredConditions.includes('snow')) {
      fallbackDescription += `Snowy conditions with potential accumulation of ${forecast.snowfall.toFixed(1)} inches may create hazardous conditions. `;
    }
    
    if (triggeredConditions.includes('wind')) {
      fallbackDescription += `High winds reaching ${forecast.windSpeed} mph may create unsafe working conditions. `;
    }
    
    if (triggeredConditions.includes('temperature')) {
      fallbackDescription += `Temperature extremes (${Math.round(forecast.temperature.min)}°F to ${Math.round(forecast.temperature.max)}°F) may require additional precautions. `;
    }
    
    // If no specific conditions were matched or fallback is empty
    if (!fallbackDescription) {
      const conditions = triggeredConditions.join(' and ');
      fallbackDescription = `Due to ${conditions} conditions, outdoor work may be challenging today. Please use caution and follow safety protocols.`;
    }
    
    return fallbackDescription.trim();
  }
}
