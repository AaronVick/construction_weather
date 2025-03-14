// scripts/weather-collector.js
// This script collects weather data for all locations in the system (user zip codes, jobsites, etc.)
// and stores it in Firebase for later use by the notification system.

import fetch from 'node-fetch';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
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

const db = admin.firestore();

// Configure weather API
const WEATHER_API_KEY = "c79650ec0dca4b67bbe154510251303";
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

// Configure debug mode from environment variables
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

/**
 * Main function to collect weather data for all locations
 */
async function collectWeatherData() {
  console.log('Starting weather data collection process...');
  console.log(`Running in ${DEBUG_MODE ? 'DEBUG' : 'PRODUCTION'} mode`);
  
  try {
    // Track unique locations to avoid duplicate API calls
    const uniqueLocations = new Map();
    
    // 1. Collect all locations from different sources
    console.log('Collecting locations from different sources...');
    
    // A. Get locations from active jobsites
    const jobsiteLocations = await getJobsiteLocations();
    for (const location of jobsiteLocations) {
      const key = getLocationKey(location);
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          ...location,
          sources: ['jobsite']
        });
      } else {
        const existing = uniqueLocations.get(key);
        if (!existing.sources.includes('jobsite')) {
          existing.sources.push('jobsite');
        }
      }
    }
    
    // B. Get locations from user profiles (zip codes)
    const userLocations = await getUserLocations();
    for (const location of userLocations) {
      const key = getLocationKey(location);
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          ...location,
          sources: ['user']
        });
      } else {
        const existing = uniqueLocations.get(key);
        if (!existing.sources.includes('user')) {
          existing.sources.push('user');
        }
      }
    }
    
    // C. Get locations from clients
    const clientLocations = await getClientLocations();
    for (const location of clientLocations) {
      const key = getLocationKey(location);
      if (!uniqueLocations.has(key)) {
        uniqueLocations.set(key, {
          ...location,
          sources: ['client']
        });
      } else {
        const existing = uniqueLocations.get(key);
        if (!existing.sources.includes('client')) {
          existing.sources.push('client');
        }
      }
    }
    
    // Convert map to array
    const locations = Array.from(uniqueLocations.values());
    console.log(`Found ${locations.length} unique locations to process`);
    
    // 2. Fetch and store weather data for each unique location
    const results = await processLocationBatches(locations);
    
    // 3. Log summary
    const successful = results.filter(r => r.success).length;
    
    console.log('\n=== Weather Collection Summary ===');
    console.log(`Total locations: ${locations.length}`);
    console.log(`Successfully processed: ${successful}`);
    console.log(`Failed: ${locations.length - successful}`);
    console.log('===================================\n');
    
    // 4. Log the collection run to Firebase
    await db.collection('weather_collection_runs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      locations_processed: locations.length,
      successful: successful,
      failed: locations.length - successful,
      debug_mode: DEBUG_MODE
    });
    
    return {
      success: true,
      locationsProcessed: locations.length,
      successfulFetches: successful,
      failedFetches: locations.length - successful
    };
  } catch (error) {
    console.error('Fatal error during weather data collection:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a unique key for a location to prevent duplicate API calls
 */
function getLocationKey(location) {
  if (location.latitude && location.longitude) {
    // Round to 2 decimal places for better grouping of nearby coordinates
    const lat = Math.round(location.latitude * 100) / 100;
    const lon = Math.round(location.longitude * 100) / 100;
    return `coords:${lat},${lon}`;
  } else if (location.zip_code) {
    return `zip:${location.zip_code}`;
  } else if (location.address) {
    return `addr:${location.address.replace(/\s+/g, '').toLowerCase()},${location.city?.toLowerCase()},${location.state?.toLowerCase()}`;
  }
  return `unknown:${JSON.stringify(location)}`;
}

/**
 * Get all locations from jobsites
 */
async function getJobsiteLocations() {
  console.log('Fetching jobsite locations...');
  
  try {
    // Get all jobsites, both active and inactive
    const jobsitesSnapshot = await db.collection('jobsites').get();
    
    const locations = [];
    
    for (const doc of jobsitesSnapshot.docs) {
      const jobsite = {
        id: doc.id,
        ...doc.data()
      };
      
      locations.push({
        id: jobsite.id,
        name: jobsite.name,
        type: 'jobsite',
        latitude: jobsite.latitude,
        longitude: jobsite.longitude,
        address: jobsite.address,
        city: jobsite.city,
        state: jobsite.state,
        zip_code: jobsite.zip_code,
        is_active: jobsite.is_active,
        weather_monitoring: jobsite.weather_monitoring
      });
    }
    
    console.log(`Found ${locations.length} jobsite locations`);
    return locations;
  } catch (error) {
    console.error('Error fetching jobsite locations:', error);
    return [];
  }
}

/**
 * Get all locations from user profiles
 */
async function getUserLocations() {
  console.log('Fetching user profile locations...');
  
  try {
    // Get all user profiles
    const userProfilesSnapshot = await db.collection('user_profiles').get();
    
    const locations = [];
    
    for (const doc of userProfilesSnapshot.docs) {
      const profile = {
        id: doc.id,
        ...doc.data()
      };
      
      // Only add if zip code exists
      if (profile.zip_code) {
        locations.push({
          id: profile.user_id || profile.id,
          name: profile.full_name || 'User Profile',
          type: 'user',
          zip_code: profile.zip_code
        });
      }
    }
    
    console.log(`Found ${locations.length} user profile locations`);
    return locations;
  } catch (error) {
    console.error('Error fetching user profile locations:', error);
    return [];
  }
}

/**
 * Get all locations from clients
 */
async function getClientLocations() {
  console.log('Fetching client locations...');
  
  try {
    // Get all clients
    const clientsSnapshot = await db.collection('clients').get();
    
    const locations = [];
    
    for (const doc of clientsSnapshot.docs) {
      const client = {
        id: doc.id,
        ...doc.data()
      };
      
      // Only add if the address or zip code exists
      if (client.address || client.zip_code) {
        locations.push({
          id: client.id,
          name: client.name || client.company || 'Client',
          type: 'client',
          address: client.address,
          city: client.city,
          state: client.state,
          zip_code: client.zip_code
        });
      }
    }
    
    console.log(`Found ${locations.length} client locations`);
    return locations;
  } catch (error) {
    console.error('Error fetching client locations:', error);
    return [];
  }
}

/**
 * Process locations in batches to avoid overwhelming the Weather API
 */
async function processLocationBatches(locations) {
  const batchSize = 20; // Adjust based on API rate limits
  const results = [];
  
  // Process in batches
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(locations.length / batchSize)}`);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(location => processLocation(location))
    );
    
    results.push(...batchResults);
    
    // Add delay between batches to respect API rate limits
    if (i + batchSize < locations.length) {
      console.log('Pausing for 2 seconds to respect API rate limits...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

/**
 * Process a single location
 */
async function processLocation(location) {
  let locationDesc = location.name;
  if (location.latitude && location.longitude) {
    locationDesc += ` (${location.latitude}, ${location.longitude})`;
  } else if (location.zip_code) {
    locationDesc += ` (${location.zip_code})`;
  } else {
    locationDesc += ` (${location.address || 'No address'})`;
  }
  
  console.log(`Processing location: ${locationDesc}`);
  
  try {
    // 1. Fetch weather data from API
    const weatherData = await fetchWeatherData(location);
    
    // 2. Store the weather data in Firestore
    await storeWeatherData(location, weatherData);
    
    return {
      location: locationDesc,
      locationId: location.id,
      locationType: location.type,
      success: true
    };
  } catch (error) {
    console.error(`Error processing location ${locationDesc}:`, error);
    return {
      location: locationDesc,
      locationId: location.id,
      locationType: location.type,
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch weather data for a location
 */
async function fetchWeatherData(location) {
  let queryParams;
  
  // Determine how to query the weather API
  if (location.latitude && location.longitude) {
    queryParams = `${location.latitude},${location.longitude}`;
  } else if (location.zip_code) {
    queryParams = location.zip_code;
  } else {
    queryParams = `${location.address}, ${location.city} ${location.state}`;
  }
  
  // Make the API request
  const url = `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(queryParams)}&days=3&alerts=yes`;
  
  console.log(`Fetching weather data for: ${queryParams}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Weather API error: ${response.status} ${text}`);
  }
  
  const data = await response.json();
  
  // Add lastUpdated timestamp
  data.lastUpdated = new Date().toISOString();
  
  return data;
}

/**
 * Store weather data in Firestore
 */
async function storeWeatherData(location, weatherData) {
  try {
    // Create a unique document ID based on location and date
    const today = new Date().toISOString().split('T')[0];
    const locationKey = getLocationKey(location);
    const docId = `${locationKey}_${today}`;
    
    // Check if we already have data for this location and date
    const docRef = db.collection('weather_data').doc(docId);
    const docSnapshot = await docRef.get();
    
    if (docSnapshot.exists) {
      // Update existing document
      await docRef.update({
        data: weatherData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        sources: admin.firestore.FieldValue.arrayUnion(...location.sources)
      });
      console.log(`Updated existing weather data for ${location.name}`);
    } else {
      // Create new document
      await docRef.set({
        locationId: location.id,
        locationType: location.type,
        locationName: location.name,
        locationKey: locationKey,
        date: today,
        data: weatherData,
        sources: location.sources,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Stored new weather data for ${location.name}`);
    }
    
    // Also store a reference in the location-specific collection for easy querying
    if (location.type === 'jobsite') {
      await db.collection('jobsites').doc(location.id).collection('weather_data').doc(today).set({
        data: weatherData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error(`Error storing weather data for ${location.name}:`, error);
    throw error;
  }
}

// Execute the main function
collectWeatherData()
  .then(result => {
    if (result.success) {
      console.log('Weather data collection completed successfully');
      process.exit(0);
    } else {
      console.error('Weather data collection failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during weather data collection:', error);
    process.exit(1);
  });