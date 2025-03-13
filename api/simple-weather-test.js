// api/simple-weather-test.js (notice the js extension, not ts)
// This is a simple serverless function that tests if the WeatherAPI is working

export default async function handler(req, res) {
    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    // Handle OPTIONS requests (for CORS preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
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
        return res.status(500).json({ error: 'Weather API key not configured on server' });
      }
  
      console.log(`Testing weather API for zip code: ${zipcode}`);
  
      // Simple test - just try to get current conditions
      const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${zipcode}`;
      
      const response = await fetch(apiUrl);
      
      // If we got a response, the API is working
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({
          success: true,
          message: 'Weather API is working correctly',
          location: data.location.name,
          temperature: data.current.temp_f,
          condition: data.current.condition.text
        });
      } else {
        // If we get an error from the WeatherAPI, pass it along
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        return res.status(response.status).json({ 
          success: false,
          error: 'Weather API error',
          details: errorData
        });
      }
    } catch (error) {
      console.error('Error testing weather API:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to test weather API',
        message: error.message || 'Unknown error'
      });
    }
  }