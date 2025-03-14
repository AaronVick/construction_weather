// api/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import fetch from 'node-fetch';

// Define types for API responses
interface ApiStatusResponse {
  weatherApi: WeatherApiStatus;
  sendgrid: SendgridStatus;
}

interface WeatherApiStatus {
  status: string;
  message: string;
  responseTime?: number;
  rateLimitRemaining?: string;
  rateLimitReset?: string;
  lastChecked: string;
  location?: string;
  currentTemp?: string;
}

interface SendgridStatus {
  status: string;
  message: string;
  responseTime?: number;
  lastChecked: string;
  emailCredits?: string | number;
  resetDate?: string;
}

// Define types for API data responses
interface WeatherApiData {
  location?: {
    name?: string;
    region?: string;
  };
  current?: {
    temp_f?: number;
  };
}

interface SendgridApiData {
  total?: number;
  reset_date?: string;
}

// API configurations
const WEATHER_API_KEY =  "c79650ec0dca4b67bbe154510251303";
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_BASE_URL = 'https://api.sendgrid.com/v3';

/**
 * API endpoint for checking the status of external APIs
 * 
 * GET /api/admin/api-status
 * 
 * Response:
 * - weatherApi: Weather API status information
 * - sendgrid: SendGrid API status information
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
    try {
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
      
      // Check Weather API status
      const weatherApiStatus = await checkWeatherApiStatus();
      
      // Check SendGrid API status
      const sendgridStatus = await checkSendgridStatus();
      
      // Log the API status check
      await db.collection('api_status_checks').add({
        user_id: userId,
        weatherApi: weatherApiStatus,
        sendgrid: sendgridStatus,
        timestamp: new Date().toISOString()
      });
      
      // Return the API status
      return res.status(200).json({
        weatherApi: weatherApiStatus,
        sendgrid: sendgridStatus
      });
    } catch (err: any) {
      console.error('Error authenticating user:', err);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: err.message
      });
    }
  } catch (err: any) {
    console.error('Error in api-status handler:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

/**
 * Check the status of the Weather API
 * @returns Promise<WeatherApiStatus> The status of the Weather API
 */
async function checkWeatherApiStatus(): Promise<WeatherApiStatus> {
  if (!WEATHER_API_KEY) {
    return {
      status: 'error',
      message: 'Weather API key is not configured',
      lastChecked: new Date().toISOString()
    };
  }
  
  try {
    // Use a simple location query to test the API
    const url = `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=Washington,DC`;
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Get rate limit information from headers if available
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || 'Unknown';
    const rateLimitReset = response.headers.get('X-RateLimit-Reset') || 'Unknown';
    
    if (response.ok) {
      const data = await response.json() as WeatherApiData;
      return {
        status: 'ok',
        message: 'Weather API is working properly',
        responseTime,
        rateLimitRemaining,
        rateLimitReset,
        lastChecked: new Date().toISOString(),
        location: data.location ? `${data.location.name || 'Unknown'}, ${data.location.region || 'Unknown'}` : 'Unknown',
        currentTemp: data.current ? `${data.current.temp_f || 0}°F` : 'Unknown'
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'error',
        message: `Weather API returned an error: ${response.status} ${errorText}`,
        responseTime,
        lastChecked: new Date().toISOString()
      };
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: `Error connecting to Weather API: ${err.message}`,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check the status of the SendGrid API
 * @returns Promise<SendgridStatus> The status of the SendGrid API
 */
async function checkSendgridStatus(): Promise<SendgridStatus> {
  if (!SENDGRID_API_KEY) {
    return {
      status: 'error',
      message: 'SendGrid API key is not configured',
      lastChecked: new Date().toISOString()
    };
  }
  
  try {
    // Use the stats endpoint to test the API
    const url = `${SENDGRID_API_BASE_URL}/user/credits`;
    
    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json() as SendgridApiData;
      return {
        status: 'ok',
        message: 'SendGrid API is working properly',
        responseTime,
        lastChecked: new Date().toISOString(),
        // Include some useful data from the response if available
        emailCredits: data.total !== undefined ? data.total : 'Unknown',
        resetDate: data.reset_date || 'Unknown'
      };
    } else {
      const errorText = await response.text();
      return {
        status: 'error',
        message: `SendGrid API returned an error: ${response.status} ${errorText}`,
        responseTime,
        lastChecked: new Date().toISOString()
      };
    }
  } catch (err: any) {
    return {
      status: 'error',
      message: `Error connecting to SendGrid API: ${err.message}`,
      lastChecked: new Date().toISOString()
    };
  }
}
