// api/admin/test-weather-notification.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';
import axios from 'axios';
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
 * API endpoint to test weather notifications
 * 
 * POST /api/admin/test-weather-notification
 * 
 * Request body:
 * - location: Object with location information (zipcode, address, coordinates, or jobsiteId)
 * - testDate: Date to test weather for
 * - overrideConditions: Whether to override weather conditions
 * - conditionOverrides: Object with weather condition overrides
 * - sendTestEmail: Whether to send a test email
 * - testEmailRecipients: Array of email addresses to send test emails to
 * - dryRun: Whether to perform a dry run (no emails sent)
 * 
 * Response:
 * - weatherData: Weather data used for the test
 * - thresholds: Thresholds used for the test
 * - triggeredConditions: Array of triggered conditions
 * - notificationPreview: Preview of the notification that would be sent
 * - emailSent: Whether an email was sent
 * - logs: Array of logs from the test
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
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
