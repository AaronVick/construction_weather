// api/weather-gpt-firebase.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { auth } from './lib/firebaseAdmin';

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
    
    // Verify the token
    await auth.verifyIdToken(token);

    const { currentWeather, forecast, triggeredConditions } = req.body;

    if (!currentWeather || !forecast || !triggeredConditions) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    const weatherDescription = await generateWeatherDescription(
      currentWeather,
      forecast,
      triggeredConditions
    );

    return res.status(200).json({ weatherDescription });
  } catch (error) {
    console.error('Error generating weather description:', error);
    return res.status(500).json({ message: 'Failed to generate weather description' });
  }
}

/**
 * Generates a weather description using OpenAI
 */
async function generateWeatherDescription(
  currentWeather: any,
  forecast: any,
  triggeredConditions: string[]
): Promise<string> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_API_URL = 'https://api.openai.com/v1';

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
