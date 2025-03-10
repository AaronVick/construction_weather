// src/services/weatherNotificationService.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebaseClient';
import { WeatherSettings, JobsiteWeatherSettings } from '../types/weather';

/**
 * Default weather notification settings
 */
export const defaultWeatherSettings: WeatherSettings = {
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

/**
 * Default jobsite weather settings
 */
export const defaultJobsiteWeatherSettings: JobsiteWeatherSettings = {
  ...defaultWeatherSettings,
  useGlobalDefaults: true,
  overrideGlobalSettings: false
};

/**
 * Get global weather notification settings for the current user
 */
export async function getGlobalWeatherSettings(): Promise<WeatherSettings> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const settingsRef = doc(db, 'user_settings', user.uid);
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists() || !settingsDoc.data().weatherSettings) {
      // If no settings exist, create default settings
      await setDoc(settingsRef, {
        weatherSettings: defaultWeatherSettings,
        updated_at: serverTimestamp()
      }, { merge: true });
      
      return defaultWeatherSettings;
    }
    
    return settingsDoc.data().weatherSettings as WeatherSettings;
  } catch (error) {
    console.error('Error fetching global weather settings:', error);
    return defaultWeatherSettings;
  }
}

/**
 * Save global weather notification settings for the current user
 */
export async function saveGlobalWeatherSettings(settings: WeatherSettings): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const settingsRef = doc(db, 'user_settings', user.uid);
    
    await updateDoc(settingsRef, {
      weatherSettings: settings,
      updated_at: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving global weather settings:', error);
    return false;
  }
}

/**
 * Get jobsite-specific weather notification settings
 */
export async function getJobsiteWeatherSettings(jobsiteId: string): Promise<JobsiteWeatherSettings> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // First, get the jobsite to verify ownership
    const jobsiteRef = doc(db, 'jobsites', jobsiteId);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    const jobsiteData = jobsiteDoc.data();
    
    // Verify the jobsite belongs to the current user
    if (jobsiteData.user_id !== user.uid) {
      throw new Error('Unauthorized access to jobsite');
    }
    
    // Get the weather settings for this jobsite
    if (!jobsiteData.weather_settings) {
      // If no settings exist, create default settings
      const globalSettings = await getGlobalWeatherSettings();
      const defaultSettings: JobsiteWeatherSettings = {
        ...globalSettings,
        useGlobalDefaults: true,
        overrideGlobalSettings: false
      };
      
      await updateDoc(jobsiteRef, {
        weather_settings: defaultSettings,
        updated_at: serverTimestamp()
      });
      
      return defaultSettings;
    }
    
    return jobsiteData.weather_settings as JobsiteWeatherSettings;
  } catch (error) {
    console.error(`Error fetching weather settings for jobsite ${jobsiteId}:`, error);
    return defaultJobsiteWeatherSettings;
  }
}

/**
 * Save jobsite-specific weather notification settings
 */
export async function saveJobsiteWeatherSettings(
  jobsiteId: string, 
  settings: JobsiteWeatherSettings
): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // First, get the jobsite to verify ownership
    const jobsiteRef = doc(db, 'jobsites', jobsiteId);
    const jobsiteDoc = await getDoc(jobsiteRef);
    
    if (!jobsiteDoc.exists()) {
      throw new Error('Jobsite not found');
    }
    
    const jobsiteData = jobsiteDoc.data();
    
    // Verify the jobsite belongs to the current user
    if (jobsiteData.user_id !== user.uid) {
      throw new Error('Unauthorized access to jobsite');
    }
    
    // Save the weather settings for this jobsite
    await updateDoc(jobsiteRef, {
      weather_settings: settings,
      updated_at: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Error saving weather settings for jobsite ${jobsiteId}:`, error);
    return false;
  }
}

/**
 * Get notification recipients for the current user
 */
export async function getNotificationRecipients() {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Query workers and clients that belong to this user
    const workersQuery = query(
      collection(db, 'workers'),
      where('user_id', '==', user.uid)
    );
    
    const clientsQuery = query(
      collection(db, 'clients'),
      where('user_id', '==', user.uid)
    );
    
    const [workersSnapshot, clientsSnapshot] = await Promise.all([
      getDocs(workersQuery),
      getDocs(clientsQuery)
    ]);
    
    const recipients = [];
    
    // Add workers
    workersSnapshot.forEach(doc => {
      const worker = doc.data();
      recipients.push({
        id: doc.id,
        name: worker.name || worker.full_name || '',
        email: worker.email || '',
        phone: worker.phone || '',
        role: 'worker' as const,
        notificationMethods: {
          email: true,
          sms: !!worker.phone,
          push: false
        }
      });
    });
    
    // Add clients
    clientsSnapshot.forEach(doc => {
      const client = doc.data();
      recipients.push({
        id: doc.id,
        name: client.name || client.company || '',
        email: client.email || '',
        phone: client.phone || '',
        role: 'client' as const,
        notificationMethods: {
          email: true,
          sms: !!client.phone,
          push: false
        }
      });
    });
    
    // Add the user as owner
    recipients.push({
      id: user.uid,
      name: user.displayName || 'Owner',
      email: user.email || '',
      role: 'owner' as const,
      notificationMethods: {
        email: true,
        sms: false,
        push: true
      }
    });
    
    return recipients;
  } catch (error) {
    console.error('Error fetching notification recipients:', error);
    return [];
  }
}

/**
 * Preview notifications based on current weather and settings
 */
export async function previewNotifications(
  settings: WeatherSettings,
  jobsiteId?: string
): Promise<{
  wouldTrigger: boolean;
  conditions: string[];
  recipients: string[];
}> {
  try {
    // This would typically call the weather API to get current conditions
    // and then check if they would trigger notifications based on the settings
    // For now, we'll return a mock response
    
    const mockConditions = ['rain', 'wind'];
    const mockRecipients = ['Owner', 'Site Manager', 'Client'];
    
    return {
      wouldTrigger: true,
      conditions: mockConditions,
      recipients: mockRecipients
    };
  } catch (error) {
    console.error('Error previewing notifications:', error);
    return {
      wouldTrigger: false,
      conditions: [],
      recipients: []
    };
  }
}
