// scripts/weather-notifier.js
// This script processes the collected weather data and sends notifications when conditions
// exceed thresholds. It uses data from Firebase instead of making direct API calls.

import * as admin from 'firebase-admin';
import { OpenAI } from 'openai';
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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure debug mode from environment variables
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

/**
 * Main function to process weather data and send notifications
 */
async function processWeatherNotifications() {
  console.log('Starting weather notification process...');
  console.log(`Running in ${DEBUG_MODE ? 'DEBUG' : 'PRODUCTION'} mode`);
  
  try {
    // 1. Get all active jobsites with weather alerts enabled
    const jobsitesSnapshot = await db.collection('jobsites')
      .where('is_active', '==', true)
      .where('weather_alerts_enabled', '==', true)
      .get();
    
    const jobsites = [];
    
    // Process each jobsite document
    for (const doc of jobsitesSnapshot.docs) {
      const jobsiteData = doc.data();
      
      // Get the company data
      const companyDoc = await db.collection('companies').doc(jobsiteData.company_id).get();
      const companyData = companyDoc.exists ? companyDoc.data() : {};
      
      // Get weather thresholds for this jobsite
      const thresholdsSnapshot = await db.collection('weather_thresholds')
        .where('jobsite_id', '==', doc.id)
        .limit(1)
        .get();
      
      const thresholds = thresholdsSnapshot.empty 
        ? null 
        : thresholdsSnapshot.docs[0].data();
      
      // Add to jobsites array
      jobsites.push({
        id: doc.id,
        ...jobsiteData,
        company: companyData,
        thresholds
      });
    }
    
    console.log(`Found ${jobsites.length} active jobsites with weather alerts enabled`);
    
    // 2. Process each jobsite
    const results = await Promise.all(
      jobsites.map(async (jobsite) => {
        try {
          return await processJobsite(jobsite);
        } catch (error) {
          console.error(`Error processing jobsite ${jobsite.id} (${jobsite.name}):`, error);
          return {
            jobsiteId: jobsite.id,
            jobsiteName: jobsite.name,
            success: false,
            error: error.message,
          };
        }
      })
    );
    
    // 3. Log summary
    const successful = results.filter(r => r.success).length;
    const notifications = results.reduce((total, r) => total + (r.notificationsSent || 0), 0);
    
    console.log('\n=== Weather Notification Summary ===');
    console.log(`Processed: ${results.length} jobsites`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${results.length - successful}`);
    console.log(`Notifications sent: ${notifications}`);
    console.log('====================================\n');
    
    // 4. Log the run to Firebase
    await db.collection('weather_notification_runs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      jobsites_processed: results.length,
      successful_checks: successful,
      failed_checks: results.length - successful,
      notifications_sent: notifications,
      debug_mode: DEBUG_MODE,
      results: results
    });
    
    return {
      success: true,
      jobsitesProcessed: results.length,
      successfulChecks: successful,
      notificationsSent: notifications,
      results
    };
  } catch (error) {
    console.error('Fatal error during weather notification process:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a single jobsite
 */
async function processJobsite(jobsite) {
  console.log(`\nProcessing jobsite: ${jobsite.name} (ID: ${jobsite.id})`);
  
  // 1. Get weather data from Firebase
  const weatherData = await getJobsiteWeatherData(jobsite);
  
  if (!weatherData) {
    return {
      jobsiteId: jobsite.id,
      jobsiteName: jobsite.name,
      success: false,
      error: 'No weather data available for this jobsite'
    };
  }
  
  // 2. Check if any weather conditions exceed thresholds
  const thresholds = jobsite.thresholds || getDefaultThresholds();
  const triggeredConditions = checkThresholds(weatherData, thresholds);
  
  // 3. Check if we've already sent a notification for these conditions today
  const shouldSendNotification = await shouldSendWeatherNotification(jobsite.id, triggeredConditions);
  
  // 4. If conditions are triggered and we should send a notification, do so
  let notificationsSent = 0;
  
  if (triggeredConditions.length > 0 && shouldSendNotification) {
    console.log(`Weather conditions triggered for ${jobsite.name}:`, triggeredConditions);
    
    // Get contacts who should receive notifications
    const contactsSnapshot = await db.collection('contacts')
      .where('company_id', '==', jobsite.company_id)
      .where('receive_weather_alerts', '==', true)
      .get();
    
    const contacts = contactsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Generate weather alert message using OpenAI
    const alertMessage = await generateWeatherAlert(jobsite, weatherData, triggeredConditions);
    
    // If not in debug mode, send actual notifications
    if (!DEBUG_MODE) {
      // Send notifications to each contact
      for (const contact of contacts) {
        await sendNotification(contact, jobsite, weatherData, triggeredConditions, alertMessage);
        notificationsSent++;
      }
      
      // Log notification to database
      await logNotification(jobsite.id, weatherData, triggeredConditions, contacts.length);
    } else {
      console.log('DEBUG MODE: Would have sent notifications to:', contacts.map(c => c.email).join(', '));
      console.log('Alert message:', alertMessage);
      notificationsSent = contacts.length; // For reporting purposes
    }
  } else if (triggeredConditions.length > 0) {
    console.log(`Weather conditions triggered for ${jobsite.name}, but notification already sent today`);
  } else {
    console.log(`No weather conditions triggered for ${jobsite.name}`);
  }
  
  return {
    jobsiteId: jobsite.id,
    jobsiteName: jobsite.name,
    success: true,
    triggeredConditions,
    conditionsExceeded: triggeredConditions.length > 0,
    notificationsSent,
  };
}

/**
 * Get weather data for a jobsite from Firebase
 */
async function getJobsiteWeatherData(jobsite) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to get data from jobsite-specific collection
    const jobsiteWeatherDoc = await db.collection('jobsites')
      .doc(jobsite.id)
      .collection('weather_data')
      .doc(today)
      .get();
    
    if (jobsiteWeatherDoc.exists) {
      return jobsiteWeatherDoc.data().data;
    }
    
    // If jobsite-specific data doesn't exist, try to find by coordinates or zip code
    let locationKey;
    
    if (jobsite.latitude && jobsite.longitude) {
      // Round to 2 decimal places for better grouping
      const lat = Math.round(jobsite.latitude * 100) / 100;
      const lon = Math.round(jobsite.longitude * 100) / 100;
      locationKey = `coords:${lat},${lon}`;
    } else if (jobsite.zip_code) {
      locationKey = `zip:${jobsite.zip_code}`;
    } else {
      locationKey = `addr:${jobsite.address.replace(/\s+/g, '').toLowerCase()},${jobsite.city?.toLowerCase()},${jobsite.state?.toLowerCase()}`;
    }
    
    const weatherQuery = await db.collection('weather_data')
      .where('locationKey', '==', locationKey)
      .where('date', '==', today)
      .limit(1)
      .get();
    
    if (!weatherQuery.empty) {
      return weatherQuery.docs[0].data().data;
    }
    
    console.log(`No weather data found for jobsite ${jobsite.name}`);
    return null;
  } catch (error) {
    console.error(`Error getting weather data for jobsite ${jobsite.id}:`, error);
    return null;
  }
}

/**
 * Check if we've already sent a notification for these conditions today
 */
async function shouldSendWeatherNotification(jobsiteId, triggeredConditions) {
  if (triggeredConditions.length === 0) {
    return false; // No conditions triggered, no need to send
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for notifications sent today for this jobsite
    const notificationsQuery = await db.collection('weather_notifications')
      .where('jobsite_id', '==', jobsiteId)
      .where('sent_at', '>=', today)
      .get();
    
    if (notificationsQuery.empty) {
      return true; // No notifications sent today, so send one
    }
    
    // Check if we've sent a notification for these specific conditions
    for (const doc of notificationsQuery.docs) {
      const notification = doc.data();
      
      // Check if the triggered conditions match
      const previousConditions = notification.triggered_conditions || [];
      const allConditionsAlreadyNotified = triggeredConditions.every(
        condition => previousConditions.includes(condition)
      );
      
      if (allConditionsAlreadyNotified) {
        return false; // Already sent notification for these conditions
      }
    }
    
    return true; // We found notifications, but not for these specific conditions
  } catch (error) {
    console.error(`Error checking for previous notifications:`, error);
    return true; // In case of error, default to sending notification
  }
}

/**
 * Check if weather conditions exceed any thresholds
 */
function checkThresholds(weatherData, thresholds) {
  const triggeredConditions = [];
  
  // Get current weather and forecast
  const current = weatherData.current;
  const forecast = weatherData.forecast.forecastday[0].day;
  
  // Check temperature thresholds
  if (thresholds.min_temperature && current.temp_f < thresholds.min_temperature) {
    triggeredConditions.push('low_temperature');
  }
  if (thresholds.max_temperature && current.temp_f > thresholds.max_temperature) {
    triggeredConditions.push('high_temperature');
  }
  
  // Check wind thresholds
  if (thresholds.max_wind_speed && current.wind_mph > thresholds.max_wind_speed) {
    triggeredConditions.push('high_wind');
  }
  
  // Check rain/precipitation thresholds
  if (thresholds.precipitation_threshold && forecast.daily_chance_of_rain > thresholds.precipitation_threshold) {
    triggeredConditions.push('rain');
  }
  
  // Check snow thresholds
  if (thresholds.snow_threshold && forecast.daily_chance_of_snow > 0 && forecast.totalsnow_cm > thresholds.snow_threshold / 2.54) { // Convert inches to cm
    triggeredConditions.push('snow');
  }
  
  // Check for weather alerts
  if (weatherData.alerts && weatherData.alerts.alert && weatherData.alerts.alert.length > 0) {
    triggeredConditions.push('weather_alert');
  }
  
  return triggeredConditions;
}

/**
 * Get default weather thresholds
 */
function getDefaultThresholds() {
  return {
    min_temperature: 32, // Freezing point in Fahrenheit
    max_temperature: 100, // Very hot
    max_wind_speed: 20, // High winds in mph
    precipitation_threshold: 70, // 70% chance of rain
    snow_threshold: 1, // 1 inch of snow
  };
}

/**
 * Generate weather alert message using OpenAI
 */
async function generateWeatherAlert(jobsite, weatherData, triggeredConditions) {
  const current = weatherData.current;
  const location = weatherData.location;
  
  const prompt = `
    Create a concise, helpful weather alert for a construction jobsite.
    
    Jobsite: ${jobsite.name}
    Location: ${location.name}, ${location.region}
    Current conditions: ${current.condition.text}, ${current.temp_f}°F, Wind: ${current.wind_mph} mph
    
    Triggered weather conditions: ${triggeredConditions.join(', ')}
    
    Write a brief, professional alert explaining the weather conditions, the potential impacts on construction work, 
    and 1-2 safety recommendations. Keep it under 150 words.
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant that creates concise weather alerts for construction jobsites." },
      { role: "user", content: prompt }
    ],
    max_tokens: 200,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content.trim();
}

/**
 * Send notification to a contact
 */
async function sendNotification(contact, jobsite, weatherData, triggeredConditions, alertMessage) {
  // Create a notification record in Firestore
  const notificationRef = await db.collection('notifications').add({
    type: 'weather_alert',
    recipient_id: contact.id,
    recipient_email: contact.email,
    jobsite_id: jobsite.id,
    jobsite_name: jobsite.name,
    company_id: jobsite.company_id,
    weather_data: {
      current_temp: weatherData.current.temp_f,
      condition: weatherData.current.condition.text,
      location: `${weatherData.location.name}, ${weatherData.location.region}`
    },
    triggered_conditions: triggeredConditions,
    message: alertMessage,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    read: false,
    sent: true
  });
  
  console.log(`Notification created for ${contact.name} (${contact.email}): ${notificationRef.id}`);
  
  // Here you would typically integrate with an email service like SendGrid
  // For this implementation, we'll just log that we would send an email
  
  console.log(`Email would be sent to: ${contact.email}`);
  console.log(`Subject: Weather Alert for ${jobsite.name}`);
  console.log(`Message: ${alertMessage}`);
  
  return {
    success: true,
    method: 'email',
    recipient: contact.email,
    notificationId: notificationRef.id
  };
}

/**
 * Log notification to database
 */
async function logNotification(jobsiteId, weatherData, triggeredConditions, recipientCount) {
  const logRef = await db.collection('weather_notifications').add({
    jobsite_id: jobsiteId,
    weather_data: weatherData,
    triggered_conditions: triggeredConditions,
    recipient_count: recipientCount,
    sent_at: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Notification logged with ID: ${logRef.id}`);
  
  return logRef.id;
}

// Execute the main function
processWeatherNotifications()
  .then(result => {
    if (result.success) {
      console.log('Weather notification process completed successfully');
      process.exit(0);
    } else {
      console.error('Weather notification process failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unhandled error during weather notification process:', error);
    process.exit(1);
  });