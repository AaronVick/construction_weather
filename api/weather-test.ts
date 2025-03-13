// api/weather-test.ts - Use .ts extension for TypeScript
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { zipcode } = req.body;
    
    if (!zipcode) {
      return res.status(400).json({ error: 'Zipcode is required' });
    }

    // Get the Weather API key from environment variables
    const WEATHER_API_KEY = process.env.WEATHER_API;
    
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key is not configured');
    }

    // Make a direct request to the Weather API
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${zipcode}&days=1&aqi=no&alerts=yes`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ 
        error: 'Weather API Error', 
        details: errorData 
      });
    }

    const weatherData = await response.json();

    return res.status(200).json({
      success: true,
      message: 'Weather API test successful',
      data: weatherData
    });
  } catch (error) {
    console.error('Error in weather test:', error);
    return res.status(500).json({
      error: 'Failed to perform weather test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}