// api/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../lib/firebaseAdmin';
import axios from 'axios';

/**
 * API endpoint to check the status of external APIs
 * 
 * GET /api/admin/api-status
 * 
 * Response:
 * - weatherApi: Status of the WeatherAPI.com API
 * - sendgrid: Status of the SendGrid API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    // Check WeatherAPI.com status
    let weatherApiStatus = {
      status: 'unknown' as 'unknown' | 'ok' | 'error',
      message: undefined as string | undefined,
      rateLimitRemaining: undefined as number | undefined,
      lastChecked: new Date().toISOString()
    };
    
    try {
      const weatherApiKey = process.env.WEATHER_API_KEY;
      
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
