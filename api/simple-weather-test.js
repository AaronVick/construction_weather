
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the API key exactly as it is in the environment
    const apiKey = process.env.WEATHER_API;
    
    // Log key details for debugging (safely)
    console.log('API key exists:', !!apiKey);
    console.log('API key length:', apiKey ? apiKey.length : 0);
    console.log('API key start/end:', apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}` : 'N/A');
    
    // Build the most minimal request possible
    const zipcode = req.query.zip || '90210';  // Default to 90210 if no zip provided
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${zipcode}`;
    
    console.log('Making request to:', url.replace(apiKey, 'API_KEY_HIDDEN'));
    
    // Make the API call with explicit options
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    // Get the response text first to safely debug
    const responseText = await response.text();
    console.log('Response body first 100 chars:', responseText.substring(0, 100));
    
    // Parse the JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      data = { error: 'Invalid JSON response', text: responseText };
    }
    
    // Return the raw data from the API
    return res.status(response.status).json({
      success: response.ok,
      statusCode: response.status,
      responseData: data
    });
  } catch (error) {
    console.error('Error in weather test:', error);
    return res.status(500).json({
      success: false,
      error: 'Exception caught',
      message: error.message,
      stack: error.stack
    });
  }
}