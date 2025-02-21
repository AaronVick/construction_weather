// api/weather-gpt.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { currentWeather, forecast, triggeredConditions } = request.body;

  if (!currentWeather || !forecast || !triggeredConditions) {
    return response.status(400).json({ error: 'Missing required weather data' });
  }

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

    const openAIResponse = await axios.post(
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

    const weatherDescription = openAIResponse.data.choices[0].message.content.trim();
    return response.status(200).json({ weatherDescription });
  } catch (error) {
    console.error('Weather GPT API Error:', error);
    
    // Provide fallback response
    const conditions = triggeredConditions.join(' and ');
    const fallbackDescription = `Due to ${conditions} conditions, outdoor work may be challenging today. Please use caution and follow safety protocols.`;
    
    return response.status(200).json({ weatherDescription: fallbackDescription });
  }
}