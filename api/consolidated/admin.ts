// api/consolidated/admin.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import axios from 'axios';
import sgMail from '@sendgrid/mail';
import { 
  fetchWeatherForecast,
  getCurrentWeather
} from '../../src/services/weatherService';
import { 
  checkWeatherConditions,
  analyzeHourlyForecast
} from '../../src/services/weatherTestService';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Consolidated API endpoint for admin functions
 * 
 * Routes:
 * - GET /api/consolidated/admin/api-status - Check status of external APIs
 * - GET /api/consolidated/admin/jobsites - Fetch jobsites for admin testing
 * - GET /api/consolidated/admin/weather-test-history - Fetch weather test history
 * - POST /api/consolidated/admin/test-weather-notification - Test weather notifications
 * - POST /api/consolidated/admin/test-email - Send a test email
 * - GET/POST /api/consolidated/admin/settings/general - Get/update general settings
 * - GET/POST /api/consolidated/admin/settings/billing - Get/update billing settings
 * - GET/POST /api/consolidated/admin/settings/security - Get/update security settings
 * - GET/POST /api/consolidated/admin/users - Get/create admin users
 * - GET/PUT/DELETE /api/consolidated/admin/users/:userId - Get/update/delete a specific admin user
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user exists
    const userRecord = await auth.getUser(userId);
    if (!userRecord) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if the user is an admin
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
    }

    // Extract the route from the URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    
    console.log('API Path:', path);
    
    // Check if this is a settings route
    if (path.includes('/settings/')) {
      const settingsMatch = path.match(/\/settings\/([^\/]+)$/);
      if (settingsMatch && settingsMatch[1]) {
        const settingsType = settingsMatch[1];
        console.log('Settings type:', settingsType);
        
        switch (settingsType) {
          case 'general':
            return handleGeneralSettings(req, res);
          case 'billing':
            return handleBillingSettings(req, res);
          case 'security':
            return handleSecuritySettings(req, res);
        }
      }
    }
    
    // Check if this is a users route
    if (path.includes('/users')) {
      // Check if there's a user ID in the path
      const userMatch = path.match(/\/users\/([^\/]+)$/);
      if (userMatch && userMatch[1]) {
        return handleAdminUser(req, res, userMatch[1]);
      }
      
      if (path.endsWith('/users')) {
        return handleAdminUsers(req, res);
      }
    }
    
    // Extract the final route segment
    const route = path.split('/').pop();
    
    // Route the request to the appropriate handler
    switch (route) {
      case 'api-status':
        return handleApiStatus(req, res);
      case 'jobsites':
        return handleJobsites(req, res);
      case 'weather-test-history':
        return handleWeatherTestHistory(req, res);
      case 'test-weather-notification':
        return handleTestWeatherNotification(req, res);
      case 'test-email':
        return handleTestEmail(req, res);
      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error in admin API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to check the status of external APIs
 */
async function handleApiStatus(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check WeatherAPI.com status
    let weatherApiStatus = {
      status: 'unknown' as 'unknown' | 'ok' | 'error',
      message: undefined as string | undefined,
      rateLimitRemaining: undefined as number | undefined,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const weatherApiKey = "c79650ec0dca4b67bbe154510251303";
      
      if (!weatherApiKey) {
        weatherApiStatus = {
          status: 'error',
          message: 'API key not configured',
          rateLimitRemaining: undefined,
          lastChecked: new Date().toISOString()
        };
      } else {
        // Make a test request to WeatherAPI.com
        const weatherResponse = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=London`
        );
        
        if (weatherResponse.status === 200) {
          weatherApiStatus = {
            status: 'ok',
            message: 'API is responding',
            rateLimitRemaining: parseInt(weatherResponse.headers['x-ratelimit-remaining'] || '0', 10),
            lastChecked: new Date().toISOString()
          };
        } else {
          weatherApiStatus = {
            status: 'error',
            message: `Unexpected status code: ${weatherResponse.status}`,
            rateLimitRemaining: undefined,
            lastChecked: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      weatherApiStatus = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        rateLimitRemaining: undefined,
        lastChecked: new Date().toISOString()
      };
    }
    
    // Check SendGrid status
    let sendgridStatus = {
      status: 'unknown' as 'unknown' | 'ok' | 'error',
      message: undefined as string | undefined,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      
      if (!sendgridApiKey) {
        sendgridStatus = {
          status: 'error',
          message: 'API key not configured',
          lastChecked: new Date().toISOString()
        };
      } else {
        // Make a test request to SendGrid
        const sendgridResponse = await axios.get('https://api.sendgrid.com/v3/user/credits', {
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`
          }
        });
        
        if (sendgridResponse.status === 200) {
          sendgridStatus = {
            status: 'ok',
            message: 'API is responding',
            lastChecked: new Date().toISOString()
          };
        } else {
          sendgridStatus = {
            status: 'error',
            message: `Unexpected status code: ${sendgridResponse.status}`,
            lastChecked: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      sendgridStatus = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      };
    }
    
    // Return the API status
    return res.status(200).json({
      weatherApi: weatherApiStatus,
      sendgrid: sendgridStatus
    });
  } catch (error) {
    console.error('Error checking API status:', error);
    
    return res.status(500).json({ 
      error: 'Failed to check API status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to fetch jobsites for admin testing
 */
async function handleJobsites(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { limit = '100', active = 'true' } = req.query;
    
    // Parse limit
    const parsedLimit = parseInt(limit as string, 10);
    const actualLimit = isNaN(parsedLimit) ? 100 : Math.min(parsedLimit, 1000);
    
    // Parse active
    const isActive = active === 'true';
    
    // Query for jobsites
    let jobsitesQuery: any = db.collection('jobsites');
    
    // Filter by active status if specified
    if (isActive) {
      jobsitesQuery = jobsitesQuery.where('is_active', '==', true);
    }
    
    // Limit the number of results
    jobsitesQuery = jobsitesQuery.limit(actualLimit);
    
    // Execute the query
    const jobsitesSnapshot = await jobsitesQuery.get();
    
    // Format the results
    const jobsites = jobsitesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Jobsite',
        address: data.address,
        zipCode: data.zip_code,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.is_active || false,
        userId: data.user_id
      };
    });
    
    // Return the jobsites
    return res.status(200).json({
      jobsites,
      count: jobsites.length,
      limit: actualLimit
    });
  } catch (error) {
    console.error('Error fetching jobsites:', error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch jobsites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to fetch weather test history
 */
async function handleWeatherTestHistory(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get query parameters
    const { limit = '10' } = req.query;
    
    // Parse limit
    const parsedLimit = parseInt(limit as string, 10);
    const actualLimit = isNaN(parsedLimit) ? 10 : Math.min(parsedLimit, 100);
    
    // Query for weather test history
    const historyQuery = db.collection('weather_test_history')
      .where('user_id', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(actualLimit);
    
    // Execute the query
    const historySnapshot = await historyQuery.get();
    
    // Format the results
    const history = historySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp.toDate().toISOString(),
        weatherData: data.weatherData,
        thresholds: data.thresholds,
        triggeredConditions: data.triggeredConditions || [],
        notificationPreview: data.notificationPreview || {
          subject: 'Weather Alert',
          recipients: [],
          templateId: 'default',
          templateData: {}
        },
        emailSent: data.emailSent || false,
        emailResponse: data.emailResponse,
        logs: data.logs || []
      };
    });
    
    // Return the history
    return res.status(200).json({
      history,
      count: history.length,
      limit: actualLimit
    });
  } catch (error) {
    console.error('Error fetching weather test history:', error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch weather test history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to test weather notifications
 */
async function handleTestWeatherNotification(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize logs array
  const logs: Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    data?: any;
  }> = [];

  // Log function
  const log = (level: 'info' | 'warning' | 'error', message: string, data?: any) => {
    logs.push({
      level,
      message,
      timestamp: new Date().toISOString(),
      data
    });
    
    if (level === 'error') {
      console.error(message, data);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  };

  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const {
      location,
      testDate,
      overrideConditions,
      conditionOverrides,
      sendTestEmail,
      testEmailRecipients,
      dryRun
    } = req.body;
    
    // Validate request
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Parse test date
    const parsedTestDate = testDate ? new Date(testDate) : new Date();
    
    // Get weather data
    let weatherData: any = null;
    let jobsiteData: any = null;
    let thresholds: any = null;
    
    // Log the test parameters
    log('info', 'Starting weather notification test', {
      location,
      testDate: parsedTestDate,
      overrideConditions,
      conditionOverrides,
      sendTestEmail,
      testEmailRecipients,
      dryRun
    });
    
    // Get weather data based on location type
    if (location.type === 'jobsite') {
      // Get jobsite data
      const jobsiteRef = db.collection('jobsites').doc(location.jobsiteId);
      const jobsiteDoc = await jobsiteRef.get();
      
      if (!jobsiteDoc.exists) {
        log('error', `Jobsite not found: ${location.jobsiteId}`);
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      jobsiteData = jobsiteDoc.data();
      
      // Get weather thresholds from jobsite
      thresholds = jobsiteData.weather_monitoring?.alertThresholds || {
        temperature: { min: 32, max: 100 },
        wind: { max: 20 },
        precipitation: { max: 0.5 },
        snow: { max: 1 }
      };
      
      // Get weather data for jobsite
      log('info', `Fetching weather data for jobsite: ${jobsiteData.name}`);
      
      if (jobsiteData.latitude && jobsiteData.longitude) {
        // Use coordinates
        weatherData = await fetchWeatherForecast(
          `${jobsiteData.latitude},${jobsiteData.longitude}`,
          2,
          true
        );
      } else if (jobsiteData.zip_code) {
        // Use zipcode
        weatherData = await fetchWeatherForecast(
          jobsiteData.zip_code,
          2,
          true
        );
      } else if (jobsiteData.address) {
        // Use address
        weatherData = await fetchWeatherForecast(
          jobsiteData.address,
          2,
          true
        );
      } else {
        log('error', 'Jobsite has no location information');
        return res.status(400).json({ error: 'Jobsite has no location information' });
      }
    } else if (location.type === 'zipcode') {
      // Use zipcode
      log('info', `Fetching weather data for zipcode: ${location.zipcode}`);
      weatherData = await fetchWeatherForecast(
        location.zipcode,
        2,
        true
      );
      
      // Use default thresholds
      thresholds = {
        temperature: { min: 32, max: 100 },
        wind: { max: 20 },
        precipitation: { max: 0.5 },
        snow: { max: 1 }
      };
    } else if (location.type === 'address') {
      // Use address
      log('info', `Fetching weather data for address: ${location.address}`);
      weatherData = await fetchWeatherForecast(
        location.address,
        2,
        true
      );
      
      // Use default thresholds
      thresholds = {
        temperature: { min: 32, max: 100 },
        wind: { max: 20 },
        precipitation: { max: 0.5 },
        snow: { max: 1 }
      };
    } else if (location.type === 'coordinates') {
      // Use coordinates
      log('info', `Fetching weather data for coordinates: ${location.latitude},${location.longitude}`);
      weatherData = await fetchWeatherForecast(
        `${location.latitude},${location.longitude}`,
        2,
        true
      );
      
      // Use default thresholds
      thresholds = {
        temperature: { min: 32, max: 100 },
        wind: { max: 20 },
        precipitation: { max: 0.5 },
        snow: { max: 1 }
      };
    } else {
      log('error', `Invalid location type: ${location.type}`);
      return res.status(400).json({ error: 'Invalid location type' });
    }
    
    // Apply condition overrides if specified
    if (overrideConditions && conditionOverrides) {
      log('info', 'Applying condition overrides', conditionOverrides);
      
      // Create a deep copy of the weather data
      const originalWeatherData = JSON.parse(JSON.stringify(weatherData));
      
      // Apply temperature override
      if (conditionOverrides.temperature !== undefined) {
        weatherData.current.temp_f = conditionOverrides.temperature;
        weatherData.current.temp_c = (conditionOverrides.temperature - 32) * 5 / 9;
        
        // Also override forecast
        if (weatherData.forecast?.forecastday?.length > 0) {
          weatherData.forecast.forecastday[0].day.maxtemp_f = conditionOverrides.temperature;
          weatherData.forecast.forecastday[0].day.maxtemp_c = (conditionOverrides.temperature - 32) * 5 / 9;
          weatherData.forecast.forecastday[0].day.mintemp_f = conditionOverrides.temperature - 5;
          weatherData.forecast.forecastday[0].day.mintemp_c = ((conditionOverrides.temperature - 5) - 32) * 5 / 9;
          
          // Override hourly forecast
          if (weatherData.forecast.forecastday[0].hour?.length > 0) {
            for (const hour of weatherData.forecast.forecastday[0].hour) {
              hour.temp_f = conditionOverrides.temperature;
              hour.temp_c = (conditionOverrides.temperature - 32) * 5 / 9;
            }
          }
        }
        
        log('info', `Overrode temperature to ${conditionOverrides.temperature}°F`);
      }
      
      // Apply rain probability override
      if (conditionOverrides.rainProbability !== undefined) {
        // Override forecast
        if (weatherData.forecast?.forecastday?.length > 0) {
          weatherData.forecast.forecastday[0].day.daily_chance_of_rain = conditionOverrides.rainProbability;
          
          // Override hourly forecast
          if (weatherData.forecast.forecastday[0].hour?.length > 0) {
            for (const hour of weatherData.forecast.forecastday[0].hour) {
              hour.chance_of_rain = conditionOverrides.rainProbability;
              
              // If probability is high, also set some precipitation
              if (conditionOverrides.rainProbability > 50) {
                hour.precip_mm = 2.0;
                hour.precip_in = 0.08;
                hour.will_it_rain = 1;
              }
            }
          }
        }
        
        log('info', `Overrode rain probability to ${conditionOverrides.rainProbability}%`);
      }
      
      // Apply snow amount override
      if (conditionOverrides.snowAmount !== undefined) {
        // Override forecast
        if (weatherData.forecast?.forecastday?.length > 0) {
          weatherData.forecast.forecastday[0].day.daily_chance_of_snow = 100;
          weatherData.forecast.forecastday[0].day.totalsnow_cm = conditionOverrides.snowAmount * 2.54;
          
          // Override hourly forecast
          if (weatherData.forecast.forecastday[0].hour?.length > 0) {
            for (const hour of weatherData.forecast.forecastday[0].hour) {
              hour.chance_of_snow = 100;
              hour.will_it_snow = 1;
              hour.snow_cm = conditionOverrides.snowAmount * 2.54 / 24;
            }
          }
        }
        
        log('info', `Overrode snow amount to ${conditionOverrides.snowAmount} inches`);
      }
      
      // Apply wind speed override
      if (conditionOverrides.windSpeed !== undefined) {
        weatherData.current.wind_mph = conditionOverrides.windSpeed;
        weatherData.current.wind_kph = conditionOverrides.windSpeed * 1.60934;
        
        // Override forecast
        if (weatherData.forecast?.forecastday?.length > 0) {
          weatherData.forecast.forecastday[0].day.maxwind_mph = conditionOverrides.windSpeed;
          weatherData.forecast.forecastday[0].day.maxwind_kph = conditionOverrides.windSpeed * 1.60934;
          
          // Override hourly forecast
          if (weatherData.forecast.forecastday[0].hour?.length > 0) {
            for (const hour of weatherData.forecast.forecastday[0].hour) {
              hour.wind_mph = conditionOverrides.windSpeed;
              hour.wind_kph = conditionOverrides.windSpeed * 1.60934;
              
              // Also set gust a bit higher
              hour.gust_mph = conditionOverrides.windSpeed * 1.5;
              hour.gust_kph = conditionOverrides.windSpeed * 1.5 * 1.60934;
            }
          }
        }
        
        log('info', `Overrode wind speed to ${conditionOverrides.windSpeed} mph`);
      }
      
      // Apply weather alert override
      if (conditionOverrides.weatherAlert) {
        weatherData.alerts = {
          alert: [
            {
              headline: `Test Alert: ${conditionOverrides.weatherAlert}`,
              severity: 'Moderate',
              urgency: 'Expected',
              areas: 'Test Area',
              category: 'Met',
              certainty: 'Likely',
              event: conditionOverrides.weatherAlert,
              note: 'Test alert for weather notification testing',
              effective: new Date().toISOString(),
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              desc: `This is a test weather alert for ${conditionOverrides.weatherAlert}. This is not a real alert.`,
              instruction: 'This is a test alert. No action is required.'
            }
          ]
        };
        
        log('info', `Added weather alert: ${conditionOverrides.weatherAlert}`);
      }
      
      // Log the changes
      log('info', 'Weather data after overrides', {
        original: originalWeatherData,
        modified: weatherData
      });
    }
    
    // Check weather conditions
    log('info', 'Checking weather conditions against thresholds', { thresholds });
    const checkResult = await checkWeatherConditions(weatherData, thresholds);
    
    // Generate weather description
    let weatherDescription = '';
    
    if (weatherData.current) {
      weatherDescription = `Current conditions: ${weatherData.current.condition?.text || 'Unknown'}, ${weatherData.current.temp_f}°F`;
      
      if (weatherData.forecast?.forecastday?.length > 0) {
        const forecast = weatherData.forecast.forecastday[0];
        weatherDescription += `. Forecast: High ${forecast.day.maxtemp_f}°F, Low ${forecast.day.mintemp_f}°F`;
        
        if (forecast.day.daily_chance_of_rain > 0) {
          weatherDescription += `, ${forecast.day.daily_chance_of_rain}% chance of rain`;
        }
        
        if (forecast.day.daily_chance_of_snow > 0) {
          weatherDescription += `, ${forecast.day.daily_chance_of_snow}% chance of snow`;
        }
      }
    }
    
    // Generate notification preview
    const notificationPreview = {
      subject: getEmailSubject(checkResult.conditions),
      recipients: [],
      templateId: getEmailTemplateId(checkResult.conditions),
      templateData: {
        jobsite_name: jobsiteData?.name || 'Test Jobsite',
        jobsite_address: jobsiteData?.address || 'Test Address',
        jobsite_city: jobsiteData?.city || 'Test City',
        jobsite_state: jobsiteData?.state || 'Test State',
        jobsite_zip: jobsiteData?.zip_code || '12345',
        weather_conditions: checkResult.conditions.join(', '),
        weather_description: weatherDescription,
        current_temperature: weatherData.current?.temp_f,
        forecast_high: weatherData.forecast?.forecastday?.[0]?.day?.maxtemp_f,
        forecast_low: weatherData.forecast?.forecastday?.[0]?.day?.mintemp_f,
        precipitation_chance: Math.max(
          weatherData.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain || 0,
          weatherData.forecast?.forecastday?.[0]?.day?.daily_chance_of_snow || 0
        ),
        wind_speed: weatherData.current?.wind_mph
      }
    };
    
    // Add recipients if sending test email
    let emailSent = false;
    let emailResponse = null;
    
    if (sendTestEmail && testEmailRecipients && testEmailRecipients.length > 0) {
      notificationPreview.recipients = testEmailRecipients.map((email: string) => ({
        email,
        name: email,
        type: 'test'
      }));
      
      // Send test email if not a dry run
      if (!dryRun) {
        try {
          log('info', `Sending test email to ${testEmailRecipients.join(', ')}`);
          
          // Check if SendGrid is configured
          if (!process.env.SENDGRID_API_KEY) {
            log('error', 'SendGrid API key not configured');
            return res.status(500).json({ 
              error: 'SendGrid API key not configured',
              logs
            });
          }
          
          // Prepare email data
          const emailData = {
            templateId: notificationPreview.templateId,
            from: {
              email: process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
              name: process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
            },
            personalizations: testEmailRecipients.map((email: string) => ({
              to: [
                {
                  email,
                  name: email
                }
              ],
              dynamicTemplateData: notificationPreview.templateData
            }))
          };
          
          // Send the email
          const response = await sgMail.send(emailData);
          
          emailSent = true;
          emailResponse = {
            statusCode: response[0]?.statusCode,
            headers: response[0]?.headers,
            messageId: response[0]?.headers['x-message-id']
          };
          
          log('info', 'Test email sent successfully', emailResponse);
        } catch (error) {
          log('error', 'Failed to send test email', error);
          
          return res.status(500).json({ 
            error: 'Failed to send test email',
            message: error instanceof Error ? error.message : 'Unknown error',
            logs
          });
        }
      } else {
        log('info', 'Dry run - no email sent');
      }
    }
    
    // Save test history if not a dry run
    if (!dryRun) {
      try {
        await db.collection('weather_test_history').add({
          user_id: userId,
          timestamp: new Date(),
          location,
          weatherData,
          thresholds,
          triggeredConditions: checkResult.conditions,
          emailSent,
          emailRecipients: notificationPreview.recipients,
          logs
        });
        
        log('info', 'Test history saved');
      } catch (error) {
        log('error', 'Failed to save test history', error);
      }
    }
    
    // Return the test results
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      weatherData,
      thresholds,
      triggeredConditions: checkResult.conditions,
      notificationPreview,
      emailSent,
      emailResponse,
      logs
    });
  } catch (error) {
    console.error('Error testing weather notification:', error);
    
    return res.status(500).json({ 
      error: 'Failed to test weather notification',
      message: error instanceof Error ? error.message : 'Unknown error',
      logs
    });
  }
}

/**
 * Get the appropriate email template ID based on weather conditions
 */
function getEmailTemplateId(conditions: string[]): string {
  // Default template
  const defaultTemplateId = process.env.SENDGRID_WEATHER_TEMPLATE_ID || 'd-default-weather-template-id';
  
  // Check for specific conditions
  if (conditions.includes('extreme_conditions') || conditions.includes('weather_alert')) {
    return process.env.SENDGRID_EXTREME_WEATHER_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('snow')) {
    return process.env.SENDGRID_SNOW_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('rain') || conditions.includes('any_rain')) {
    return process.env.SENDGRID_RAIN_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('wind')) {
    return process.env.SENDGRID_WIND_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('temperature')) {
    return process.env.SENDGRID_TEMPERATURE_TEMPLATE_ID || defaultTemplateId;
  }
  
  return defaultTemplateId;
}

/**
 * Get email subject based on weather conditions
 */
function getEmailSubject(conditions: string[]): string {
  // Default subject
  let subject = 'Weather Alert for Your Jobsite';
  
  // Check for specific conditions
  if (conditions.includes('extreme_conditions') || conditions.includes('weather_alert')) {
    subject = 'URGENT: Extreme Weather Alert for Your Jobsite';
  } else if (conditions.includes('snow')) {
    subject = 'Snow Alert for Your Jobsite';
  } else if (conditions.includes('rain') || conditions.includes('any_rain')) {
    subject = 'Rain Alert for Your Jobsite';
  } else if (conditions.includes('wind')) {
    subject = 'High Wind Alert for Your Jobsite';
  } else if (conditions.includes('temperature')) {
    subject = 'Temperature Alert for Your Jobsite';
  }
  
  return subject;
}

/**
 * API endpoint to send a test email
 */
async function handleTestEmail(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const {
      testEmailRecipients,
      emailSubject,
      emailBody,
      fromEmail,
      fromName
    } = req.body;
    
    // Validate request
    if (!testEmailRecipients || !Array.isArray(testEmailRecipients) || testEmailRecipients.length === 0) {
      return res.status(400).json({ error: 'At least one email recipient is required' });
    }
    
    if (!emailSubject) {
      return res.status(400).json({ error: 'Email subject is required' });
    }
    
    if (!emailBody) {
      return res.status(400).json({ error: 'Email body is required' });
    }
    
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ 
        error: 'SendGrid API key not configured',
        message: 'The SendGrid API key is not configured. Please add it to your environment variables.'
      });
    }
    
    // Prepare email data
    const from = {
      email: fromEmail || process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
      name: fromName || process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
    };
    
    const to = testEmailRecipients.map((email: string) => ({
      email,
      name: email
    }));
    
    const emailData = {
      from,
      to,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>')
    };
    
    // Send the email
    const response = await sgMail.send(emailData);
    
    // Log the email send
    await db.collection('email_logs').add({
      user_id: userId,
      sentAt: new Date(),
      subject: emailSubject,
      body: emailBody,
      recipients: testEmailRecipients,
      status: 'sent',
      trigger: 'test',
      fromEmail: from.email,
      fromName: from.name
    });
    
    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${testEmailRecipients.join(', ')}`,
      details: {
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers,
        messageId: response[0]?.headers['x-message-id']
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * API endpoint to handle general settings
 */
async function handleGeneralSettings(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Handle GET request
    if (req.method === 'GET') {
      // Get general settings from Firestore
      const settingsRef = db.collection('admin_settings').doc('general');
      const settingsDoc = await settingsRef.get();
      
      if (!settingsDoc.exists) {
        // Return default settings if not found
        return res.status(200).json({
          siteName: 'Construction Weather',
          siteDescription: 'Weather monitoring and alerts for construction sites',
          supportEmail: 'support@constructionweather.com',
          defaultLanguage: 'en',
          defaultTimezone: 'America/New_York',
          enableMaintenanceMode: false,
          maintenanceMessage: 'The system is currently undergoing maintenance. Please check back later.'
        });
      }
      
      // Return settings
      return res.status(200).json(settingsDoc.data());
    }
    
    // Handle POST request
    if (req.method === 'POST') {
      // Get request body
      const {
        siteName,
        siteDescription,
        supportEmail,
        defaultLanguage,
        defaultTimezone,
        enableMaintenanceMode,
        maintenanceMessage
      } = req.body;
      
      // Validate request
      if (!siteName) {
        return res.status(400).json({ error: 'Site name is required' });
      }
      
      if (!supportEmail) {
        return res.status(400).json({ error: 'Support email is required' });
      }
      
      // Save settings to Firestore
      const settingsRef = db.collection('admin_settings').doc('general');
      await settingsRef.set({
        siteName,
        siteDescription,
        supportEmail,
        defaultLanguage,
        defaultTimezone,
        enableMaintenanceMode,
        maintenanceMessage,
        updatedAt: new Date(),
        updatedBy: userId
      }, { merge: true });
      
      // Return success
      return res.status(200).json({
        success: true,
        message: 'General settings saved successfully'
      });
    }
    
    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling general settings:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle general settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to handle billing settings
 */
async function handleBillingSettings(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Handle GET request
    if (req.method === 'GET') {
      // Get billing settings from Firestore
      const settingsRef = db.collection('admin_settings').doc('billing');
      const settingsDoc = await settingsRef.get();
      
      // Get subscription plans
      const plansRef = db.collection('subscription_plans');
      const plansSnapshot = await plansRef.where('isDeleted', '==', false).get();
      
      const plans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if Stripe is connected
      const stripeConnected = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY);
      
      if (!settingsDoc.exists) {
        // Return default settings if not found
        return res.status(200).json({
          stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',
          currency: 'USD',
          taxRate: 0,
          enableTrialPeriod: true,
          trialDays: 14,
          stripeConnected,
          plans
        });
      }
      
      // Return settings
      return res.status(200).json({
        ...settingsDoc.data(),
        stripeConnected,
        plans
      });
    }
    
    // Handle POST request
    if (req.method === 'POST') {
      // Get request body
      const {
        stripePublicKey,
        stripeSecretKey,
        currency,
        taxRate,
        enableTrialPeriod,
        trialDays
      } = req.body;
      
      // Validate request
      if (!stripePublicKey) {
        return res.status(400).json({ error: 'Stripe public key is required' });
      }
      
      // Save settings to Firestore
      const settingsRef = db.collection('admin_settings').doc('billing');
      await settingsRef.set({
        stripePublicKey,
        currency,
        taxRate,
        enableTrialPeriod,
        trialDays,
        updatedAt: new Date(),
        updatedBy: userId
      }, { merge: true });
      
      // Update environment variables if secret key is provided
      if (stripeSecretKey && !stripeSecretKey.includes('•')) {
        // In a real application, you would update the environment variables
        // For this example, we'll just log it
        console.log('Stripe secret key updated');
      }
      
      // Check if Stripe is connected
      const stripeConnected = !!(stripePublicKey && (stripeSecretKey || process.env.STRIPE_SECRET_KEY));
      
      // Return success
      return res.status(200).json({
        success: true,
        message: 'Billing settings saved successfully',
        stripeConnected
      });
    }
    
    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling billing settings:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle billing settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to handle security settings
 */
async function handleSecuritySettings(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Handle GET request
    if (req.method === 'GET') {
      // Get security settings from Firestore
      const settingsRef = db.collection('admin_settings').doc('security');
      const settingsDoc = await settingsRef.get();
      
      if (!settingsDoc.exists) {
        // Return default settings if not found
        return res.status(200).json({
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireLowercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          enableTwoFactor: false,
          allowedIpAddresses: ''
        });
      }
      
      // Return settings
      return res.status(200).json(settingsDoc.data());
    }
    
    // Handle POST request
    if (req.method === 'POST') {
      // Get request body
      const {
        passwordMinLength,
        passwordRequireUppercase,
        passwordRequireLowercase,
        passwordRequireNumbers,
        passwordRequireSymbols,
        sessionTimeout,
        maxLoginAttempts,
        enableTwoFactor,
        allowedIpAddresses
      } = req.body;
      
      // Validate request
      if (passwordMinLength < 6) {
        return res.status(400).json({ error: 'Password minimum length must be at least 6 characters' });
      }
      
      // Save settings to Firestore
      const settingsRef = db.collection('admin_settings').doc('security');
      await settingsRef.set({
        passwordMinLength,
        passwordRequireUppercase,
        passwordRequireLowercase,
        passwordRequireNumbers,
        passwordRequireSymbols,
        sessionTimeout,
        maxLoginAttempts,
        enableTwoFactor,
        allowedIpAddresses,
        updatedAt: new Date(),
        updatedBy: userId
      }, { merge: true });
      
      // Return success
      return res.status(200).json({
        success: true,
        message: 'Security settings saved successfully'
      });
    }
    
    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling security settings:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle security settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to handle admin users
 */
async function handleAdminUsers(req: VercelRequest, res: VercelResponse) {
  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user is a super admin
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'super_admin';
    
    // Handle GET request
    if (req.method === 'GET') {
      // Get admin users from Firestore
      const usersRef = db.collection('user_profiles');
      const usersSnapshot = await usersRef.where('role', 'in', ['admin', 'super_admin']).get();
      
      const users = await Promise.all(usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        
        // Get user auth data
        let lastLogin = null;
        try {
          const userRecord = await auth.getUser(doc.id);
          lastLogin = userRecord.metadata.lastSignInTime;
        } catch (error) {
          console.error(`Error fetching user auth data for ${doc.id}:`, error);
        }
        
        return {
          id: doc.id,
          email: userData.email,
          name: userData.name || userData.email,
          role: userData.role,
          lastLogin,
          createdAt: userData.createdAt?.toDate().toISOString() || null
        };
      }));
      
      // Return users
      return res.status(200).json({
        users,
        count: users.length
      });
    }
    
    // Handle POST request (create new admin user)
    if (req.method === 'POST') {
      // Only super admins can create new admin users
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Permission denied. Only super admins can create new admin users.' });
      }
      
      // Get request body
      const {
        email,
        name,
        role,
        password
      } = req.body;
      
      // Validate request
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!role || !['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required' });
      }
      
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      // Create user in Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name
        });
      } catch (error) {
        console.error('Error creating user in Firebase Auth:', error);
        return res.status(500).json({ 
          error: 'Failed to create user',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Create user profile in Firestore
      const userProfileRef = db.collection('user_profiles').doc(userRecord.uid);
      await userProfileRef.set({
        email,
        name,
        role,
        createdAt: new Date(),
        createdBy: userId
      });
      
      // Return success
      return res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: userRecord.uid,
          email,
          name,
          role,
          lastLogin: null,
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling admin users:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle admin users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to handle a specific admin user
 */
async function handleAdminUser(req: VercelRequest, res: VercelResponse, targetUserId: string) {
  try {
    // Get the user ID from the authenticated user
    const authHeader = req.headers.authorization;
    const token = authHeader?.split('Bearer ')[1] || '';
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user is a super admin
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isSuperAdmin = userDoc.exists && userDoc.data()?.role === 'super_admin';
    
    // Check if the target user exists
    const targetUserRef = db.collection('user_profiles').doc(targetUserId);
    const targetUserDoc = await targetUserRef.get();
    
    if (!targetUserDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const targetUserData = targetUserDoc.data();
    
    // Handle GET request
    if (req.method === 'GET') {
      // Get user auth data
      let lastLogin = null;
      try {
        const userRecord = await auth.getUser(targetUserId);
        lastLogin = userRecord.metadata.lastSignInTime;
      } catch (error) {
        console.error(`Error fetching user auth data for ${targetUserId}:`, error);
      }
      
      // Return user
      return res.status(200).json({
        id: targetUserId,
        email: targetUserData?.email,
        name: targetUserData?.name || targetUserData?.email,
        role: targetUserData?.role,
        lastLogin,
        createdAt: targetUserData?.createdAt?.toDate().toISOString() || null
      });
    }
    
    // Handle PUT request (update admin user)
    if (req.method === 'PUT') {
      // Only super admins can update admin users
      if (!isSuperAdmin && userId !== targetUserId) {
        return res.status(403).json({ error: 'Permission denied. Only super admins can update other admin users.' });
      }
      
      // Get request body
      const {
        name,
        role
      } = req.body;
      
      // Validate request
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      if (!role || !['admin', 'super_admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required' });
      }
      
      // Regular admins cannot promote themselves to super admin
      if (!isSuperAdmin && role === 'super_admin' && targetUserData?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Permission denied. Only super admins can promote users to super admin.' });
      }
      
      // Update user profile in Firestore
      await targetUserRef.update({
        name,
        role,
        updatedAt: new Date(),
        updatedBy: userId
      });
      
      // Update user in Firebase Auth
      try {
        await auth.updateUser(targetUserId, {
          displayName: name
        });
      } catch (error) {
        console.error('Error updating user in Firebase Auth:', error);
      }
      
      // Return success
      return res.status(200).json({
        success: true,
        message: 'Admin user updated successfully',
        user: {
          id: targetUserId,
          email: targetUserData?.email,
          name,
          role,
          lastLogin: null, // We don't have this information here
          createdAt: targetUserData?.createdAt?.toDate().toISOString() || null
        }
      });
    }
    
    // Handle DELETE request
    if (req.method === 'DELETE') {
      // Only super admins can delete admin users
      if (!isSuperAdmin) {
        return res.status(403).json({ error: 'Permission denied. Only super admins can delete admin users.' });
      }
      
      // Cannot delete yourself
      if (userId === targetUserId) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }
      
      // Delete user from Firebase Auth
      try {
        await auth.deleteUser(targetUserId);
      } catch (error) {
        console.error('Error deleting user from Firebase Auth:', error);
        return res.status(500).json({ 
          error: 'Failed to delete user',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Delete user profile from Firestore
      await targetUserRef.delete();
      
      // Return success
      return res.status(200).json({
        success: true,
        message: 'Admin user deleted successfully'
      });
    }
    
    // Handle other methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling admin user:', error);
    
    return res.status(500).json({ 
      error: 'Failed to handle admin user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
