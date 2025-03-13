// api/admin/test-weather-api.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
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
interface WeatherApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  apiStatus?: {
    status: string;
    responseTime?: number;
    rateLimitRemaining?: string;
    rateLimitReset?: string;
    lastChecked: string;
    message?: string;
  };
  logs?: Array<{
    level: string;
    message: string;
    timestamp: string;
  }>;
}

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

/**
 * Admin API endpoint for directly testing the Weather API
 * 
 * POST /api/admin/test-weather-api
 * 
 * Request body:
 * - locationType: 'zipcode' | 'address' | 'coordinates' | 'jobsite'
 * - zipcode?: string (if locationType is 'zipcode')
 * - address?: string (if locationType is 'address')
 * - latitude?: number (if locationType is 'coordinates')
 * - longitude?: number (if locationType is 'coordinates')
 * - jobsiteId?: string (if locationType is 'jobsite')
 * 
 * Response:
 * - success: boolean
 * - data: Weather API response data
 * - apiStatus: Status information about the Weather API
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
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
      
      // Get query parameters from request body
      const { 
        locationType, 
        zipcode, 
        address, 
        latitude, 
        longitude, 
        jobsiteId 
      } = req.body;
      
      // Validate input
      if (!locationType) {
        return res.status(400).json({ error: 'Location type is required' });
      }
      
      // Determine query parameters based on location type
      let queryParams;
      let locationDescription;
      
      if (locationType === 'zipcode') {
        if (!zipcode) {
          return res.status(400).json({ error: 'Zipcode is required for zipcode location type' });
        }
        queryParams = zipcode;
        locationDescription = `Zipcode: ${zipcode}`;
      } 
      else if (locationType === 'address') {
        if (!address) {
          return res.status(400).json({ error: 'Address is required for address location type' });
        }
        queryParams = address;
        locationDescription = `Address: ${address}`;
      } 
      else if (locationType === 'coordinates') {
        if (latitude === undefined || longitude === undefined) {
          return res.status(400).json({ error: 'Latitude and longitude are required for coordinates location type' });
        }
        queryParams = `${latitude},${longitude}`;
        locationDescription = `Coordinates: ${latitude}, ${longitude}`;
      } 
      else if (locationType === 'jobsite') {
        if (!jobsiteId) {
          return res.status(400).json({ error: 'Jobsite ID is required for jobsite location type' });
        }
        
        // Get jobsite information
        const jobsiteRef = db.collection('jobsites').doc(jobsiteId);
        const jobsiteDoc = await jobsiteRef.get();
        
        if (!jobsiteDoc.exists) {
          return res.status(404).json({ error: `Jobsite with ID ${jobsiteId} not found` });
        }
        
        const jobsiteData = jobsiteDoc.data() || {};
        locationDescription = `Jobsite: ${jobsiteData.name || 'Unknown'}`;
        
        // Determine best location query for this jobsite
        if (jobsiteData.latitude && jobsiteData.longitude) {
          queryParams = `${jobsiteData.latitude},${jobsiteData.longitude}`;
        } else if (jobsiteData.zip_code) {
          queryParams = jobsiteData.zip_code;
        } else {
          queryParams = `${jobsiteData.address || ''}, ${jobsiteData.city || ''} ${jobsiteData.state || ''}`;
        }
      } 
      else {
        return res.status(400).json({ error: 'Invalid location type' });
      }
      
      // Create a logs array to track the API test process
      const logs = [
        {
          level: 'info',
          message: 'Weather API test started',
          timestamp: new Date().toISOString()
        },
        {
          level: 'info',
          message: `Testing location: ${locationDescription}`,
          timestamp: new Date().toISOString()
        }
      ];
      
      // Verify Weather API key is configured
      if (!WEATHER_API_KEY) {
        logs.push({
          level: 'error',
          message: 'Weather API key is not configured',
          timestamp: new Date().toISOString()
        });
        
        return res.status(500).json({
          success: false,
          error: 'Weather API key is not configured',
          logs
        });
      }
      
      // Construct the weather API URL - include forecast and alerts for a complete test
      const url = `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(queryParams)}&days=1&alerts=yes`;
      
      logs.push({
        level: 'info',
        message: `Sending request to Weather API for: ${queryParams}`,
        timestamp: new Date().toISOString()
      });
      
      // Make the request
      try {
        const startTime = Date.now();
        const response = await fetch(url);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Get rate limit information from headers if available
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining') || 'Unknown';
        const rateLimitReset = response.headers.get('X-RateLimit-Reset') || 'Unknown';
        
        if (response.ok) {
          const data = await response.json();
          
          logs.push({
            level: 'info',
            message: `Weather API response received in ${responseTime}ms`,
            timestamp: new Date().toISOString()
          });
          
          logs.push({
            level: 'info',
            message: 'Weather API test completed successfully',
            timestamp: new Date().toISOString()
          });
          
          // Log the successful test
          await db.collection('weather_api_tests').add({
            user_id: userId,
            location_type: locationType,
            location_description: locationDescription,
            query_params: queryParams,
            success: true,
            response_time: responseTime,
            rate_limit_remaining: rateLimitRemaining,
            timestamp: new Date().toISOString(),
            logs
          });
          
          return res.status(200).json({
            success: true,
            data,
            apiStatus: {
              status: 'ok',
              responseTime,
              rateLimitRemaining,
              rateLimitReset,
              lastChecked: new Date().toISOString()
            },
            logs
          });
        } else {
          const errorText = await response.text();
          
          logs.push({
            level: 'error',
            message: `Weather API error (${response.status}): ${errorText}`,
            timestamp: new Date().toISOString()
          });
          
          // Log the failed test
          await db.collection('weather_api_tests').add({
            user_id: userId,
            location_type: locationType,
            location_description: locationDescription,
            query_params: queryParams,
            success: false,
            error: {
              status: response.status,
              message: errorText
            },
            response_time: responseTime,
            timestamp: new Date().toISOString(),
            logs
          });
          
          return res.status(200).json({
            success: false,
            error: `Weather API returned an error: ${response.status} ${errorText}`,
            apiStatus: {
              status: 'error',
              responseTime,
              rateLimitRemaining,
              rateLimitReset,
              lastChecked: new Date().toISOString()
            },
            logs
          });
        }
      } catch (error) {
        const apiError = error as ApiError;
        logs.push({
          level: 'error',
          message: `Error connecting to Weather API: ${apiError.message || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        });
        
        // Log the failed test
        await db.collection('weather_api_tests').add({
          user_id: userId,
          location_type: locationType,
          location_description: locationDescription,
          query_params: queryParams,
          success: false,
          error: {
            message: apiError.message
          },
          timestamp: new Date().toISOString(),
          logs
        });
        
        return res.status(200).json({
          success: false,
          error: `Error connecting to Weather API: ${apiError.message || 'Unknown error'}`,
          apiStatus: {
            status: 'error',
            message: apiError.message || 'Unknown error',
            lastChecked: new Date().toISOString()
          },
          logs
        });
      }
    } catch (authError) {
      const error = authError as ApiError;
      console.error('Error authenticating user:', error);
      return res.status(401).json({ 
        success: false,
        error: 'Authentication failed',
        message: error.message
      });
    }
  } catch (err) {
    const error = err as ApiError;
    console.error('Error in test-weather-api handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
