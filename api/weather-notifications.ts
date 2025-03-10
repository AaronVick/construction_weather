// api/weather-notifications.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { auth, db } from './lib/firebaseAdmin';
import { WeatherSettings, JobsiteWeatherSettings } from '../src/types/weather';

/**
 * API endpoint for weather notification settings
 * 
 * GET: Retrieve notification settings
 * POST: Save notification settings
 * 
 * Query parameters:
 * - type: 'global' or 'jobsite'
 * - jobsiteId: Required if type is 'jobsite'
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user exists
    const userRecord = await auth.getUser(userId);
    if (!userRecord) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Get the type of settings to retrieve/save
    const { type, jobsiteId } = req.query;
    
    if (!type || (type !== 'global' && type !== 'jobsite')) {
      return res.status(400).json({ error: 'Invalid type parameter. Must be "global" or "jobsite".' });
    }
    
    if (type === 'jobsite' && !jobsiteId) {
      return res.status(400).json({ error: 'jobsiteId parameter is required for jobsite settings.' });
    }
    
    // Handle GET request (retrieve settings)
    if (req.method === 'GET') {
      if (type === 'global') {
        // Get global settings
        const settingsRef = db.collection('user_settings').doc(userId);
        const settingsDoc = await settingsRef.get();
        
        if (!settingsDoc.exists || !settingsDoc.data()?.weatherSettings) {
          // Return default settings
          return res.status(200).json({
            settings: getDefaultWeatherSettings(),
            isDefault: true
          });
        }
        
        return res.status(200).json({
          settings: settingsDoc.data()?.weatherSettings,
          isDefault: false
        });
      } else {
        // Get jobsite settings
        // First, verify the jobsite belongs to the user
        const jobsiteRef = db.collection('jobsites').doc(jobsiteId as string);
        const jobsiteDoc = await jobsiteRef.get();
        
        if (!jobsiteDoc.exists) {
          return res.status(404).json({ error: 'Jobsite not found' });
        }
        
        const jobsiteData = jobsiteDoc.data();
        if (jobsiteData?.user_id !== userId) {
          return res.status(403).json({ error: 'You do not have permission to access this jobsite' });
        }
        
        if (!jobsiteData?.weather_settings) {
          // Get global settings to use as defaults
          const userSettingsRef = db.collection('user_settings').doc(userId);
          const userSettingsDoc = await userSettingsRef.get();
          
          let globalSettings = getDefaultWeatherSettings();
          if (userSettingsDoc.exists && userSettingsDoc.data()?.weatherSettings) {
            globalSettings = userSettingsDoc.data()?.weatherSettings;
          }
          
          // Return jobsite settings with global defaults
          const defaultJobsiteSettings: JobsiteWeatherSettings = {
            ...globalSettings,
            useGlobalDefaults: true,
            overrideGlobalSettings: false
          };
          
          return res.status(200).json({
            settings: defaultJobsiteSettings,
            isDefault: true
          });
        }
        
        return res.status(200).json({
          settings: jobsiteData.weather_settings,
          isDefault: false
        });
      }
    }
    
    // Handle POST request (save settings)
    if (req.method === 'POST') {
      const settings = req.body.settings;
      
      if (!settings) {
        return res.status(400).json({ error: 'Settings object is required' });
      }
      
      if (type === 'global') {
        // Save global settings
        const settingsRef = db.collection('user_settings').doc(userId);
        
        await settingsRef.set({
          weatherSettings: settings,
          updated_at: new Date()
        }, { merge: true });
        
        return res.status(200).json({ success: true });
      } else {
        // Save jobsite settings
        // First, verify the jobsite belongs to the user
        const jobsiteRef = db.collection('jobsites').doc(jobsiteId as string);
        const jobsiteDoc = await jobsiteRef.get();
        
        if (!jobsiteDoc.exists) {
          return res.status(404).json({ error: 'Jobsite not found' });
        }
        
        const jobsiteData = jobsiteDoc.data();
        if (jobsiteData?.user_id !== userId) {
          return res.status(403).json({ error: 'You do not have permission to access this jobsite' });
        }
        
        // Save the settings
        await jobsiteRef.update({
          weather_settings: settings,
          updated_at: new Date()
        });
        
        return res.status(200).json({ success: true });
      }
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling weather notification settings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get default weather notification settings
 */
function getDefaultWeatherSettings(): WeatherSettings {
  return {
    isEnabled: true,
    checkTime: "06:00", // 6 AM
    forecastTimeframe: {
      hoursAhead: 12,
      workingHoursOnly: true,
      workingHoursStart: "07:00", // 7 AM
      workingHoursEnd: "17:00", // 5 PM
      includeDayBefore: true,
      checkDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    alertThresholds: {
      rain: {
        enabled: true,
        thresholdPercentage: 50,
        amountThreshold: 0.25
      },
      snow: {
        enabled: true,
        thresholdPercentage: 40,
        amountThreshold: 1.0
      },
      sleet: {
        enabled: true,
        thresholdPercentage: 40,
        amountThreshold: 0.1
      },
      hail: {
        enabled: true,
        thresholdPercentage: 30,
        amountThreshold: 0.1
      },
      wind: {
        enabled: true,
        thresholdMph: 20
      },
      temperature: {
        enabled: true,
        minThresholdFahrenheit: 32,
        maxThresholdFahrenheit: 95
      },
      specialAlerts: {
        enabled: true,
        includeStorms: true,
        includeLightning: true,
        includeFlooding: true,
        includeExtreme: true
      },
      airQuality: {
        enabled: false,
        thresholdIndex: 150
      }
    },
    notificationSettings: {
      notifyClient: true,
      notifyWorkers: true,
      notificationLeadHours: 12,
      dailySummary: true,
      recipients: []
    }
  };
}
