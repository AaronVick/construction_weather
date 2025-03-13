
// api/simple-weather-test.js
// This endpoint will first try to directly test the WeatherAPI
// If that works, it will also trigger the GitHub workflow

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('API Route hit - Method:', req.method);
  console.log('Query params:', req.query);

  // Get zipcode from query parameter or request body
  const zipcode = req.query.zip || (req.body && req.body.zipcode) || '90210';
  
  try {
    // STEP 1: Direct test with WeatherAPI
    console.log(`Testing WeatherAPI directly for location: ${zipcode}`);
    
    // Your API key from environment variables or hardcoded for testing only
    // IMPORTANT: If hardcoding for testing, REMOVE after testing is complete
    const WEATHER_API_KEY = 'c79650ec0dca4b67bbe154510251303';
    
    if (!WEATHER_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Weather API key not configured'
      });
    }

    // Make the API request
    const weatherApiUrl = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${zipcode}`;
    console.log('Making request to WeatherAPI.com...');
    
    const weatherResponse = await fetch(weatherApiUrl);
    console.log('Weather API response status:', weatherResponse.status);
    
    // Get the response as text first
    const responseText = await weatherResponse.text();
    
    // Try to parse as JSON
    let weatherData;
    try {
      weatherData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse weather API response:', e);
      weatherData = { error: 'Invalid JSON response' };
    }

    // If the weather API test was successful
    if (weatherResponse.ok) {
      console.log('WeatherAPI test successful!');
      
      // STEP 2: Try to trigger GitHub workflow (but don't fail if this doesn't work)
      let workflowResult = null;
      
      try {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO_PATH = process.env.GITHUB_REPO || 'AaronVick/construction_weather';
        
        if (GITHUB_TOKEN) {
          console.log('GitHub token exists, attempting to trigger workflow...');
          
          // Only load Octokit if we have a token
          const { Octokit } = await import('@octokit/rest');
          const octokit = new Octokit({ auth: GITHUB_TOKEN });
          
          const [GITHUB_ORG, GITHUB_REPO] = GITHUB_REPO_PATH.split('/');
          
          // Try to trigger the workflow
          await octokit.rest.actions.createWorkflowDispatch({
            owner: GITHUB_ORG,
            repo: GITHUB_REPO,
            workflow_id: 'admin-weather-check.yml',
            ref: 'main',
            inputs: {
              location: zipcode,
              debug: 'true'
            }
          });
          
          // Get the latest workflow runs
          const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
            owner: GITHUB_ORG,
            repo: GITHUB_REPO,
            workflow_id: 'admin-weather-check.yml',
            per_page: 1
          });
          
          if (runs.workflow_runs && runs.workflow_runs.length > 0) {
            const latestRun = runs.workflow_runs[0];
            workflowResult = {
              workflowRunId: latestRun.id,
              workflowRunUrl: latestRun.html_url,
              status: latestRun.status
            };
          }
          
          console.log('GitHub workflow triggered successfully');
        }
      } catch (workflowError) {
        console.error('Error triggering GitHub workflow:', workflowError);
        // Don't fail the request if the workflow trigger fails
      }
      
      // Return success response with weather data
      return res.status(200).json({
        success: true,
        message: 'Weather API test successful',
        location: weatherData.location.name,
        region: weatherData.location.region,
        country: weatherData.location.country,
        temperature: weatherData.current.temp_f,
        condition: weatherData.current.condition.text,
        // Include workflow info if available
        workflowTriggered: !!workflowResult,
        workflow: workflowResult
      });
    } else {
      // Weather API test failed
      console.error('Weather API test failed:', weatherData);
      return res.status(weatherResponse.status).json({
        success: false,
        error: 'Weather API test failed',
        details: weatherData
      });
    }
  } catch (error) {
    console.error('Error in weather test endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Exception caught',
      message: error.message || 'Unknown error'
    });
  }
}
// // api/simple-weather-test.js
// // IMPORTANT: REMOVE THE HARDCODED API KEY AFTER TESTING!

// export default async function handler(req, res) {
//   // Enable CORS
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   try {
//     // IMPORTANT: Replace 'YOUR_ACTUAL_API_KEY_HERE' with your real API key
//     // REMOVE THIS AFTER TESTING! Never leave API keys in code!
//     const apiKey = 'c79650ec0dca4b67bbe154510251303'; // ⚠️ REPLACE THIS WITH YOUR ACTUAL KEY
    
//     // Build the request
//     const zipcode = req.query.zip || '90210';
//     const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${zipcode}`;
    
//     console.log('Making request to WeatherAPI.com...');
    
//     // Make the API call
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Accept': 'application/json',
//       },
//     });
    
//     console.log('Response status:', response.status);
    
//     // Get the response
//     const responseText = await response.text();
    
//     // Parse the JSON
//     let data;
//     try {
//       data = JSON.parse(responseText);
//     } catch (e) {
//       console.error('Failed to parse JSON response:', e);
//       data = { error: 'Invalid JSON response', text: responseText };
//     }
    
//     // Return the data
//     return res.status(response.status).json({
//       success: response.ok,
//       statusCode: response.status,
//       responseData: data
//     });
//   } catch (error) {
//     console.error('Error in weather test:', error);
//     return res.status(500).json({
//       success: false,
//       error: 'Exception caught',
//       message: error.message
//     });
//   }
// }