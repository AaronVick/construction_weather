// api/consolidated/notifications.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Consolidated API endpoint for notification functions
 * 
 * Routes:
 * - POST /api/consolidated/notifications/preview
 * - POST /api/consolidated/notifications/send-weather-alert
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Extract the route from the URL
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const path = url.pathname;
    const route = path.split('/').pop();

    // Route the request to the appropriate handler
    switch (route) {
      case 'preview':
        return handlePreview(req, res);
      case 'send-weather-alert':
        return handleSendWeatherAlert(req, res);
      default:
        return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error in notifications API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to preview a notification
 */
async function handlePreview(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const { templateId, templateData } = req.body;
    
    if (!templateId || !templateData) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'SendGrid API key not configured' });
    }
    
    // Get user data
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data() || {};
    
    // Generate preview data
    const previewData = {
      templateId,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
        name: process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
      },
      to: {
        email: userData.email || '',
        name: userData.displayName || userData.email || ''
      },
      dynamicTemplateData: templateData
    };
    
    return res.status(200).json({ preview: previewData });
  } catch (error) {
    console.error('Error generating notification preview:', error);
    
    return res.status(500).json({ 
      error: 'Failed to generate notification preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * API endpoint to send a weather alert notification
 */
async function handleSendWeatherAlert(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token from the request headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Get request body
    const { 
      jobsiteId, 
      recipients, 
      subject, 
      weatherData, 
      conditions, 
      templateId 
    } = req.body;
    
    if (!jobsiteId || !recipients || !recipients.length || !subject || !weatherData || !conditions || !templateId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ error: 'SendGrid API key not configured' });
    }
    
    // Get jobsite data
    const jobsiteRef = db.collection('jobsites').doc(jobsiteId);
    const jobsiteDoc = await jobsiteRef.get();
    
    if (!jobsiteDoc.exists) {
      return res.status(404).json({ error: 'Jobsite not found' });
    }
    
    const jobsiteData = jobsiteDoc.data() || {};
    
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
    
    // Prepare email data
    const templateData = {
      jobsite_name: jobsiteData.name || 'Unnamed Jobsite',
      jobsite_address: jobsiteData.address || '',
      jobsite_city: jobsiteData.city || '',
      jobsite_state: jobsiteData.state || '',
      jobsite_zip: jobsiteData.zip_code || '',
      weather_conditions: conditions.join(', '),
      weather_description: weatherDescription,
      current_temperature: weatherData.current?.temp_f,
      forecast_high: weatherData.forecast?.forecastday?.[0]?.day?.maxtemp_f,
      forecast_low: weatherData.forecast?.forecastday?.[0]?.day?.mintemp_f,
      precipitation_chance: Math.max(
        weatherData.forecast?.forecastday?.[0]?.day?.daily_chance_of_rain || 0,
        weatherData.forecast?.forecastday?.[0]?.day?.daily_chance_of_snow || 0
      ),
      wind_speed: weatherData.current?.wind_mph
    };
    
    // Prepare email message
    const message = {
      templateId,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
        name: process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
      },
      personalizations: recipients.map((recipient: any) => ({
        to: [
          {
            email: recipient.email,
            name: recipient.name || recipient.email
          }
        ],
        subject,
        dynamicTemplateData: templateData
      }))
    };
    
    // Send the email
    const response = await sgMail.send(message);
    
    // Log the notification
    await db.collection('notification_history').add({
      user_id: userId,
      jobsite_id: jobsiteId,
      recipients: recipients.map((r: any) => ({ email: r.email, name: r.name })),
      subject,
      template_id: templateId,
      template_data: templateData,
      conditions,
      weather_data: {
        current: {
          temperature: weatherData.current?.temp_f,
          condition: weatherData.current?.condition?.text,
          wind_speed: weatherData.current?.wind_mph,
          precipitation: weatherData.current?.precip_in
        },
        forecast: weatherData.forecast?.forecastday?.map((day: any) => ({
          date: day.date,
          max_temp: day.day.maxtemp_f,
          min_temp: day.day.mintemp_f,
          condition: day.day.condition.text,
          chance_of_rain: day.day.daily_chance_of_rain,
          chance_of_snow: day.day.daily_chance_of_snow
        }))
      },
      status: 'sent',
      sent_at: new Date().toISOString(),
      response: {
        status_code: response[0].statusCode,
        message_id: response[0].headers['x-message-id']
      }
    });
    
    return res.status(200).json({ 
      success: true, 
      message: `Weather alert sent to ${recipients.length} recipients`,
      response: {
        statusCode: response[0].statusCode,
        messageId: response[0].headers['x-message-id']
      }
    });
  } catch (error) {
    console.error('Error sending weather alert:', error);
    
    return res.status(500).json({ 
      error: 'Failed to send weather alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
