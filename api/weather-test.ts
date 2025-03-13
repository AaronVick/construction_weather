// api/weather-test.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  try {
    // Extract the token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Authorization header or invalid format');
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Authenticated user:', decodedToken.uid);
    
    // If needed, check if the user has admin role
    // You might want to verify if the user has admin permissions here
    const userSnapshot = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    const userData = userSnapshot.data();
    
    if (!userData || !userData.isAdmin) {
      console.log('User is not an admin');
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
  } catch (authError) {
    console.error('Authentication error:', authError);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }

  // Continue with the weather API call
  try {
    const { zipcode } = req.body;
    
    if (!zipcode) {
      return res.status(400).json({ error: 'Zipcode is required' });
    }

    // Get the Weather API key from environment variables
    const WEATHER_API_KEY = process.env.WEATHER_API;
    
    if (!WEATHER_API_KEY) {
      throw new Error('Weather API key is not configured');
    }

    console.log(`Fetching weather data for zipcode: ${zipcode}`);

    // Make a direct request to the Weather API
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${zipcode}&days=1&aqi=no&alerts=yes`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Weather API Error (${response.status}):`, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return res.status(response.status).json({ 
        error: 'Weather API Error', 
        details: errorData
      });
    }

    const weatherData = await response.json();
    console.log('Weather API response received successfully');

    return res.status(200).json({
      success: true,
      message: 'Weather API test successful',
      data: weatherData
    });
  } catch (error) {
    console.error('Error in weather test:', error);
    return res.status(500).json({
      error: 'Failed to perform weather test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}