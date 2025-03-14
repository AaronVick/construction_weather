// scripts/weather-notifier.js
// This script processes the collected weather data and sends notifications when conditions
// exceed thresholds. It uses data from Firebase instead of making direct API calls.
// The script now processes users first, handling different subscription plans (basic, pro, enterprise)
// and determining how and if emails should be sent based on various data points.

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
    // 1. Get all users with active subscriptions
    const usersSnapshot = await db.collection('users').get();
    
    const users = [];
    
    // Process each user document
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // Get the user's subscription
      const subscriptionsQuery = await db.collection('subscriptions')
        .where('user_id', '==', doc.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      
      if (subscriptionsQuery.empty) {
        continue; // Skip users without active subscriptions
      }
      
      const subscription = subscriptionsQuery.docs[0].data();
      
      // Get user profile for additional data like zip code
      const profileDoc = await db.collection('user_profiles').doc(doc.id).get();
      const profile = profileDoc.exists ? profileDoc.data() : {};
      
      // Get user's global weather settings
      const settingsDoc = await db.collection('weather_settings').doc(doc.id).get();
      const weatherSettings = settingsDoc.exists ? settingsDoc.data() : getDefaultWeatherSettings();
      
      // Add to users array
      users.push({
        id: doc.id,
        ...userData,
        subscription,
        profile,
        weatherSettings
      });
    }
    
    console.log(`Found ${users.length} users with active subscriptions`);
    
    // 2. Process each user based on their subscription plan
    const results = [];
    
    for (const user of users) {
      try {
        let userResult;
        
        // Process differently based on subscription plan
        if (user.subscription.plan === 'basic') {
          userResult = await processBasicUser(user);
        } else if (['premium', 'enterprise'].includes(user.subscription.plan)) {
          userResult = await processProEnterpriseUser(user);
        } else {
          console.log(`Skipping user ${user.id} with unsupported plan: ${user.subscription.plan}`);
          continue;
        }
        
        results.push(userResult);
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.push({
          userId: user.id,
          success: false,
          error: error.message
        });
      }
    }
    
    // 3. Log summary
    const successful = results.filter(r => r.success).length;
    const notifications = results.reduce((total, r) => total + (r.notificationsSent || 0), 0);
    
    console.log('\n=== Weather Notification Summary ===');
    console.log(`Processed: ${results.length} users`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${results.length - successful}`);
    console.log(`Notifications sent: ${notifications}`);
    console.log('====================================\n');
    
    // 4. Log the run to Firebase
    await db.collection('weather_notification_runs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      users_processed: results.length,
      successful_checks: successful,
      failed_checks: results.length - successful,
      notifications_sent: notifications,
      debug_mode: DEBUG_MODE,
      results: results
    });
    
    return {
      success: true,
      usersProcessed: results.length,
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
 * Process a basic user (uses zip code from profile)
 */
async function processBasicUser(user) {
  console.log(`\nProcessing basic user: ${user.id}`);
  
  // Ensure user has a zip code
  if (!user.profile.zip_code) {
    return {
      userId: user.id,
      success: false,
      error: 'No zip code found in user profile'
    };
  }
  
  // 1. Get weather data for user's zip code
  const weatherData = await getWeatherDataForZipCode(user.profile.zip_code);
  
  if (!weatherData) {
    return {
      userId: user.id,
      success: false,
      error: 'No weather data available for this user\'s zip code'
    };
  }
  
  // 2. Check if any weather conditions exceed thresholds
  const thresholds = user.weatherSettings.alertThresholds || getDefaultThresholds();
  const triggeredConditions = checkThresholds(weatherData, thresholds);
  
  // 3. Check if we've already sent a notification for these conditions today
  const shouldSendNotification = await shouldSendWeatherNotificationForUser(user.id, triggeredConditions);
  
  // 4. If conditions are triggered and we should send a notification, do so
  let notificationsSent = 0;
  
  if (triggeredConditions.length > 0 && shouldSendNotification) {
    console.log(`Weather conditions triggered for user ${user.id}:`, triggeredConditions);
    
    // Get active clients for this user
    const clientsSnapshot = await db.collection('clients')
      .where('user_id', '==', user.id)
      .where('is_active', '==', true)
      .get();
    
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get active workers for this user
    const workersSnapshot = await db.collection('workers')
      .where('user_id', '==', user.id)
      .where('is_active', '==', true)
      .get();
    
    const workers = workersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Combine clients and workers into contacts
    const contacts = [
      ...clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        type: 'client'
      })),
      ...workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        type: 'worker'
      }))
    ];
    
    // Generate weather alert message using OpenAI
    const alertMessage = await generateWeatherAlert(
      { name: `${user.profile.full_name}'s Location` }, 
      weatherData, 
      triggeredConditions
    );
    
    // If not in debug mode, send actual notifications
    if (!DEBUG_MODE) {
      // Send notifications to each contact
      for (const contact of contacts) {
        await sendNotification(contact, null, weatherData, triggeredConditions, alertMessage, user.id);
        notificationsSent++;
      }
      
      // Log notification to database
      await logNotificationForUser(user.id, weatherData, triggeredConditions, contacts.length);
    } else {
      console.log('DEBUG MODE: Would have sent notifications to:', contacts.map(c => c.email).join(', '));
      console.log('Alert message:', alertMessage);
      notificationsSent = contacts.length; // For reporting purposes
    }
  } else if (triggeredConditions.length > 0) {
    console.log(`Weather conditions triggered for user ${user.id}, but notification already sent today`);
  } else {
    console.log(`No weather conditions triggered for user ${user.id}`);
  }
  
  return {
    userId: user.id,
    success: true,
    triggeredConditions,
    conditionsExceeded: triggeredConditions.length > 0,
    notificationsSent,
  };
}

/**
 * Process a pro or enterprise user (uses jobsites)
 */
async function processProEnterpriseUser(user) {
  console.log(`\nProcessing pro/enterprise user: ${user.id}`);
  
  // 1. Get all active jobsites for this user
  const jobsitesSnapshot = await db.collection('jobsites')
    .where('user_id', '==', user.id)
    .where('is_active', '==', true)
    .get();
  
  const jobsites = [];
  
  // Process each jobsite document
  for (const doc of jobsitesSnapshot.docs) {
    const jobsiteData = doc.data();
    
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
      thresholds,
      useGlobalSettings: jobsiteData.weather_monitoring?.useGlobalSettings !== false
    });
  }
  
  console.log(`Found ${jobsites.length} active jobsites for user ${user.id}`);
  
  if (jobsites.length === 0) {
    return {
      userId: user.id,
      success: true,
      notificationsSent: 0,
      message: 'No active jobsites found for this user'
    };
  }
  
  // 2. Process each jobsite
  const jobsiteResults = await Promise.all(
    jobsites.map(async (jobsite) => {
      try {
        return await processJobsite(jobsite, user);
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
  
  // 3. Aggregate results
  const successful = jobsiteResults.filter(r => r.success).length;
  const notificationsSent = jobsiteResults.reduce((total, r) => total + (r.notificationsSent || 0), 0);
  
  return {
    userId: user.id,
    success: true,
    jobsitesProcessed: jobsites.length,
    successfulJobsites: successful,
    failedJobsites: jobsites.length - successful,
    notificationsSent,
    jobsiteResults
  };
}

/**
 * Get weather data for a zip code
 */
async function getWeatherDataForZipCode(zipCode) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const locationKey = `zip:${zipCode}`;
    
    const weatherQuery = await db.collection('weather_data')
      .where('locationKey', '==', locationKey)
      .where('date', '==', today)
      .limit(1)
      .get();
    
    if (!weatherQuery.empty) {
      return weatherQuery.docs[0].data().data;
    }
    
    console.log(`No weather data found for zip code ${zipCode}`);
    return null;
  } catch (error) {
    console.error(`Error getting weather data for zip code ${zipCode}:`, error);
    return null;
  }
}

/**
 * Check if we've already sent a notification for these conditions today for a user
 */
async function shouldSendWeatherNotificationForUser(userId, triggeredConditions) {
  if (triggeredConditions.length === 0) {
    return false; // No conditions triggered, no need to send
  }
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for notifications sent today for this user
    const notificationsQuery = await db.collection('weather_notifications')
      .where('user_id', '==', userId)
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
 * Log notification to database for a user
 */
async function logNotificationForUser(userId, weatherData, triggeredConditions, recipientCount) {
  const logRef = await db.collection('weather_notifications').add({
    user_id: userId,
    weather_data: weatherData,
    triggered_conditions: triggeredConditions,
    recipient_count: recipientCount,
    sent_at: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Notification logged with ID: ${logRef.id}`);
  
  return logRef.id;
}

/**
 * Process a single jobsite
 */
async function processJobsite(jobsite, user) {
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
  // Use jobsite-specific thresholds if available, otherwise use user's global settings
  let thresholds;
  if (jobsite.useGlobalSettings || !jobsite.thresholds) {
    thresholds = user.weatherSettings.alertThresholds || getDefaultThresholds();
  } else {
    thresholds = jobsite.thresholds;
  }
  
  const triggeredConditions = checkThresholds(weatherData, thresholds);
  
  // 3. Check if we've already sent a notification for these conditions today
  const shouldSendNotification = await shouldSendWeatherNotification(jobsite.id, triggeredConditions);
  
  // 4. If conditions are triggered and we should send a notification, do so
  let notificationsSent = 0;
  
  if (triggeredConditions.length > 0 && shouldSendNotification) {
    console.log(`Weather conditions triggered for ${jobsite.name}:`, triggeredConditions);
    
    // Get clients associated with this jobsite
    const clientsSnapshot = await db.collection('clients')
      .where('user_id', '==', user.id)
      .where('is_active', '==', true)
      .get();
    
    const clients = clientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get workers associated with this jobsite
    const workersSnapshot = await db.collection('workers')
      .where('user_id', '==', user.id)
      .where('is_active', '==', true)
      .get();
    
    const workers = workersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Combine clients and workers into contacts
    const contacts = [
      ...clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        type: 'client'
      })),
      ...workers.map(worker => ({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        type: 'worker'
      }))
    ];
    
    // Generate weather alert message using OpenAI
    const alertMessage = await generateWeatherAlert(jobsite, weatherData, triggeredConditions);
    
    // If not in debug mode, send actual notifications
    if (!DEBUG_MODE) {
      // Send notifications to each contact
      for (const contact of contacts) {
        await sendNotification(contact, jobsite, weatherData, triggeredConditions, alertMessage, user.id);
        notificationsSent++;
      }
      
      // Log notification to database
      await logNotification(jobsite.id, weatherData, triggeredConditions, contacts.length, user.id);
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
 * Get default weather settings
 */
function getDefaultWeatherSettings() {
  return {
    isEnabled: true,
    checkTime: 'daily',
    checkTimeDaily: '06:00',
    timezone: 'America/New_York',
    alertThresholds: {
      rain: {
        enabled: true,
        thresholdPercentage: 50,
        amountThreshold: 0.5
      },
      snow: {
        enabled: true,
        thresholdPercentage: 50,
        amountThreshold: 1.0
      },
      temperature: {
        enabled: true,
        minThresholdFahrenheit: 32,
        maxThresholdFahrenheit: 95
      },
      wind: {
        enabled: true,
        thresholdMph: 20
      },
      specialAlerts: {
        enabled: true,
        includeStorms: true,
        includeLightning: true,
        includeFlooding: true,
        includeExtreme: true
      }
    },
    notificationSettings: {
      notifyClient: true,
      notifyWorkers: true,
      notificationLeadHours: 12,
      dailySummary: false,
      recipients: []
    }
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
async function sendNotification(contact, jobsite, weatherData, triggeredConditions, alertMessage, userId) {
  // Create a notification record in Firestore
  const notificationData = {
    type: 'weather_alert',
    recipient_id: contact.id,
    recipient_email: contact.email,
    recipient_type: contact.type,
    user_id: userId,
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
  };
  
  // Add jobsite information if available
  if (jobsite) {
    notificationData.jobsite_id = jobsite.id;
    notificationData.jobsite_name = jobsite.name;
  }
  
  const notificationRef = await db.collection('notifications').add(notificationData);
  
  console.log(`Notification created for ${contact.name} (${contact.email}): ${notificationRef.id}`);
  
  // Here you would typically integrate with an email service like SendGrid
  // For this implementation, we'll just log that we would send an email
  
  console.log(`Email would be sent to: ${contact.email}`);
  console.log(`Subject: Weather Alert for ${jobsite ? jobsite.name : 'Your Location'}`);
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
async function logNotification(jobsiteId, weatherData, triggeredConditions, recipientCount, userId) {
  const logData = {
    weather_data: weatherData,
    triggered_conditions: triggeredConditions,
    recipient_count: recipientCount,
    user_id: userId,
    sent_at: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Add jobsite ID if available
  if (jobsiteId) {
    logData.jobsite_id = jobsiteId;
  }
  
  const logRef = await db.collection('weather_notifications').add(logData);
  
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
