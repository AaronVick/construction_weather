// api/simple-weather-test.js
// IMPORTANT: REMOVE THE HARDCODED API KEY AFTER TESTING!

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // IMPORTANT: Replace 'YOUR_ACTUAL_API_KEY_HERE' with your real API key
    // REMOVE THIS AFTER TESTING! Never leave API keys in code!
    const apiKey = 'c79650ec0dca4b67bbe154510251303'; // ⚠️ REPLACE THIS WITH YOUR ACTUAL KEY
    
    // Build the request
    const zipcode = req.query.zip || '90210';
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${zipcode}`;
    
    console.log('Making request to WeatherAPI.com...');
    
    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    // Get the response
    const responseText = await response.text();
    
    // Parse the JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      data = { error: 'Invalid JSON response', text: responseText };
    }
    
    // Return the data
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
      message: error.message
    });
  }
}