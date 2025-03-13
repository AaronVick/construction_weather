// api/consolidated/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../../src/lib/firebaseAdmin';
import fetch from 'node-fetch';

// Define types for error handling
interface ApiError extends Error {
  code?: string;
  status?: number;
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Define types for API responses
interface ConsolidatedApiStatusResponse {
  weatherApi: WeatherApiStatus;
  sendgrid: SendgridStatus;
  database: DatabaseStatus;
  auth: AuthStatus;
  lastChecked: string;
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

interface DatabaseStatus {
  status: string;
  message: string;
  responseTime?: number;
  lastChecked: string;
}

interface AuthStatus {
  status: string;
  message: string;
  responseTime?: number;
  lastChecked: string;
  userCount?: number;
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
const WEATHER_API_KEY = process.env.WEATHER_API;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_BASE_URL = 'https://api.sendgrid.com/v3';

/**
 * Consolidated API endpoint for checking the status of all external services
 * 
 * GET /api/consolidated/admin/api-status
 * 
 * Response:
 * - weatherApi: Weather API status information
 * - sendgrid: SendGrid API status information
 * - database: Firestore database status
 * - auth: Firebase Auth status
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
      
      // Run all status checks in parallel
      const [weatherApiStatus, sendgridStatus, databaseStatus, authStatus] = await Promise.all([
        checkWeatherApiStatus(),
        checkSendgridStatus(),
        checkDatabaseStatus(),
        checkAuthStatus()
      ]);
      
      // Log the API status check
      await db.collection('api_status_checks').add({
        user_id: userId,
        weatherApi: weatherApiStatus,
        sendgrid: sendgridStatus,
        database: databaseStatus,
        auth: authStatus,
        timestamp: new Date().toISOString()
      });
      
      // Return the combined API status
      return res.status(200).json({
        weatherApi: weatherApiStatus,
        sendgrid: sendgridStatus,
        database: databaseStatus,
        auth: authStatus,
        lastChecked: new Date().toISOString()
      });
    } catch (err) {
      const authError = err as ApiError;
      console.error('Error authenticating user:', authError);
      return res.status(401).json({ 
        error: 'Authentication failed',
        message: authError.message
      });
    }
  } catch (err) {
    const error = err as ApiError;
    console.error('Error in consolidated api-status handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
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
  } catch (err) {
    const error = err as ApiError;
    return {
      status: 'error',
      message: `Error connecting to Weather API: ${error.message}`,
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
  } catch (err) {
    const error = err as ApiError;
    return {
      status: 'error',
      message: `Error connecting to SendGrid API: ${error.message}`,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check the status of the Firestore database
 * @returns Promise<DatabaseStatus> The status of the Firestore database
 */
async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  try {
    const startTime = Date.now();
    
    // Try to read a document from the database
    const docRef = db.collection('system_health').doc('database');
    await docRef.set({
      status: 'ok',
      lastChecked: new Date().toISOString()
    });
    
    const docSnapshot = await docRef.get();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (docSnapshot.exists) {
      return {
        status: 'ok',
        message: 'Firestore database is working properly',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    } else {
      return {
        status: 'error',
        message: 'Firestore database write succeeded but read failed',
        responseTime,
        lastChecked: new Date().toISOString()
      };
    }
  } catch (err) {
    const error = err as ApiError;
    return {
      status: 'error',
      message: `Error accessing Firestore database: ${error.message}`,
      lastChecked: new Date().toISOString()
    };
  }
}

/**
 * Check the status of Firebase Auth
 * @returns Promise<AuthStatus> The status of Firebase Auth
 */
async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const startTime = Date.now();
    
    // Try to list users (limited to 1) to test Auth API
    const listUsersResult = await auth.listUsers(1);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      status: 'ok',
      message: 'Firebase Auth is working properly',
      responseTime,
      lastChecked: new Date().toISOString(),
      userCount: listUsersResult.users.length
    };
  } catch (err) {
    const error = err as ApiError;
    return {
      status: 'error',
      message: `Error accessing Firebase Auth: ${error.message}`,
      lastChecked: new Date().toISOString()
    };
  }
}
