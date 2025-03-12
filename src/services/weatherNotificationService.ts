// src/services/weatherNotificationService.ts
import { 
  WeatherSettings, 
  NotificationRecipient,
  PrecipitationThresholds,
  TemperatureThresholds,
  WindThresholds,
  SpecialAlertThresholds,
  AirQualityThresholds,
  WeatherData,
  CurrentWeather,
  ForecastDay,
  WeatherAlert,
  WeatherLocation
} from '../types/weather';
import { fetchCompleteWeatherData } from './weatherService';
import { db, auth } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Define type for notification preview
interface NotificationPreview {
  subject: string;
  recipients: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    methods: {
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  }[];
  content: {
    location: WeatherLocation | null;
    currentWeather: CurrentWeather | null;
    forecast: ForecastDay[];
    alerts: WeatherAlert[];
    triggeredAlerts: string[];
  }
}

// Define type for preview result
interface PreviewResult {
  wouldSendNotification: boolean;
  alerts: string[];
  notificationPreview: NotificationPreview;
}

/**
 * Get global weather notification settings
 */
export async function getGlobalWeatherSettings(): Promise<WeatherSettings> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Try to fetch from Firestore
    const settingsDoc = doc(db, 'weather_settings', user.uid);
    const settingsSnapshot = await getDoc(settingsDoc);
    
    if (settingsSnapshot.exists()) {
      return settingsSnapshot.data() as WeatherSettings;
    }
    
    // If not found, return default settings
    return getDefaultWeatherSettings();
  } catch (error) {
    console.error('Error fetching global weather settings:', error);
    return getDefaultWeatherSettings();
  }
}

/**
 * Save global weather notification settings
 */
export async function saveGlobalWeatherSettings(settings: WeatherSettings): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Save to Firestore
    const settingsDoc = doc(db, 'weather_settings', user.uid);
    await setDoc(settingsDoc, settings, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error saving global weather settings:', error);
    return false;
  }
}

/**
 * Get notification recipients
 */
export async function getNotificationRecipients(): Promise<NotificationRecipient[]> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Try to fetch from Firestore
    const recipientsQuery = query(
      collection(db, 'notification_recipients'),
      where('user_id', '==', user.uid)
    );
    
    const recipientsSnapshot = await getDocs(recipientsQuery);
    
    if (recipientsSnapshot.empty) {
      return getDefaultRecipients();
    }
    
    return recipientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as NotificationRecipient[];
  } catch (error) {
    console.error('Error fetching notification recipients:', error);
    return getDefaultRecipients();
  }
}

/**
 * Preview notifications based on current settings and weather data
 */
export async function previewNotifications(settings: WeatherSettings, zipCode?: string): Promise<PreviewResult> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // If no zip code provided, try to get from user profile
    if (!zipCode) {
      const profileDoc = doc(db, 'user_profiles', user.uid);
      const profileSnapshot = await getDoc(profileDoc);
      
      if (profileSnapshot.exists()) {
        zipCode = profileSnapshot.data().zip_code;
      }
      
      if (!zipCode) {
        throw new Error('No ZIP code found in profile');
      }
    }
    
    // Fetch weather data
    const apiWeatherData = await fetchCompleteWeatherData(zipCode);
    
    // Convert to our internal WeatherData structure
    // Convert to our internal WeatherData structure
// Create a default current weather object
const defaultCurrentWeather: CurrentWeather = {
  temperature: 0,
  feelsLike: 0,
  condition: 'Unknown',
  humidity: 0,
  windSpeed: 0,
  precipitation: 0,
  isRainy: false,
  isSnowy: false,
  icon: ''
};

// Convert to our internal WeatherData structure
const weatherData: WeatherData = {
  location: apiWeatherData.location || {
    name: zipCode,
    region: '',
    country: ''
  },
  // Use the API data or default to an empty weather object, but never null
  current: apiWeatherData.current ? {
    temperature: apiWeatherData.current.temperature,
    feelsLike: apiWeatherData.current.feelsLike,
    condition: apiWeatherData.current.condition,
    humidity: apiWeatherData.current.humidity,
    windSpeed: apiWeatherData.current.windSpeed,
    precipitation: apiWeatherData.current.precipitation,
    isRainy: apiWeatherData.current.isRainy,
    isSnowy: apiWeatherData.current.isSnowy,
    icon: apiWeatherData.current.icon
  } : defaultCurrentWeather,
  forecast: apiWeatherData.forecast || [],
  alerts: apiWeatherData.alerts || []
};
    
    // Check if any thresholds are exceeded
    const alerts = checkWeatherThresholds(weatherData, settings);
    
    // Generate preview of notification that would be sent
    const notificationPreview = generateNotificationPreview(weatherData, alerts, settings);
    
    // Return the preview result
    return {
      wouldSendNotification: alerts.length > 0,
      alerts,
      notificationPreview
    };
  } catch (error) {
    console.error('Error previewing notifications:', error);
    // Return an empty preview result instead of throwing
    return {
      wouldSendNotification: false,
      alerts: [],
      notificationPreview: {
        subject: 'Error previewing notifications',
        recipients: [],
        content: {
          location: null,
          currentWeather: null,
          forecast: [],
          alerts: [],
          triggeredAlerts: []
        }
      }
    };
  }
}

/**
 * Check if weather conditions exceed any threshold settings
 */
function checkWeatherThresholds(
  weatherData: WeatherData, 
  settings: WeatherSettings
): string[] {
  const alerts: string[] = [];
  const thresholds = settings.alertThresholds;
  
  // Skip if notifications are disabled
  if (!settings.isEnabled) {
    return alerts;
  }
  
  // Check current conditions
  if (weatherData.current) {
    // Temperature check
    if (thresholds.temperature.enabled) {
      const temp = weatherData.current.temperature;
      if (temp < thresholds.temperature.minThresholdFahrenheit) {
        alerts.push('low_temperature');
      }
      if (temp > thresholds.temperature.maxThresholdFahrenheit) {
        alerts.push('high_temperature');
      }
    }
    
    // Wind check
    if (thresholds.wind.enabled && weatherData.current.windSpeed > thresholds.wind.thresholdMph) {
      alerts.push('high_winds');
    }
  }
  
  // Check forecast
  if (weatherData.forecast && weatherData.forecast.length > 0) {
    // Rain check
    if (thresholds.rain.enabled) {
      const hasRain = weatherData.forecast.some(day => 
        day.precipitation > thresholds.rain.thresholdPercentage
      );
      
      if (hasRain) {
        alerts.push('rain');
      }
    }
    
    // Snow check
    if (thresholds.snow.enabled) {
      const hasSnow = weatherData.forecast.some(day => 
        (day.snowfall || 0) > thresholds.snow.amountThreshold
      );
      
      if (hasSnow) {
        alerts.push('snow');
      }
    }
  }
  
  // Check for special alerts
  if (thresholds.specialAlerts.enabled && weatherData.alerts && weatherData.alerts.length > 0) {
    const { includeStorms, includeFlooding, includeLightning, includeExtreme } = thresholds.specialAlerts;
    
    weatherData.alerts.forEach(alert => {
      const eventLower = alert.event.toLowerCase();
      
      if (includeStorms && (eventLower.includes('storm') || eventLower.includes('hurricane') || eventLower.includes('tornado'))) {
        alerts.push('storm');
      }
      
      if (includeFlooding && (eventLower.includes('flood'))) {
        alerts.push('flooding');
      }
      
      if (includeLightning && (eventLower.includes('lightning') || eventLower.includes('thunder'))) {
        alerts.push('lightning');
      }
      
      if (includeExtreme && (
        eventLower.includes('extreme') || 
        eventLower.includes('severe') || 
        eventLower.includes('warning') || 
        alert.severity.toLowerCase() === 'severe' || 
        alert.severity.toLowerCase() === 'extreme'
      )) {
        alerts.push('extreme_weather');
      }
    });
  }
  
  // Use Array.from instead of spread to avoid TypeScript issues
  return Array.from(new Set(alerts));
}

/**
 * Generate a preview of notification content
 */
function generateNotificationPreview(
  weatherData: WeatherData,
  alerts: string[],
  settings: WeatherSettings
): NotificationPreview {
  // Get recipients who should receive notifications
  const eligibleRecipients = settings.notificationSettings.recipients
    .filter(r => (
      (settings.notificationSettings.notifyClient && r.role === 'client') || 
      (settings.notificationSettings.notifyWorkers && (r.role === 'worker' || r.role === 'manager'))
    ))
    .map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      methods: r.notificationMethods
    }));

  // Basic notification structure
  const notification: NotificationPreview = {
    subject: alerts.length > 0 
      ? 'Weather Alert: Conditions May Impact Your Jobsite'
      : 'Weather Update for Your Jobsite',
    recipients: eligibleRecipients,
    content: {
      location: weatherData.location,
      currentWeather: weatherData.current,
      forecast: weatherData.forecast.slice(0, 3),
      alerts: weatherData.alerts,
      triggeredAlerts: alerts
    }
  };
  
  return notification;
}

/**
 * Get default weather settings
 */
function getDefaultWeatherSettings(): WeatherSettings {
  const defaultRainThresholds: PrecipitationThresholds = {
    enabled: true,
    thresholdPercentage: 50,
    amountThreshold: 0.5
  };
  
  const defaultSnowThresholds: PrecipitationThresholds = {
    enabled: true,
    thresholdPercentage: 50,
    amountThreshold: 1.0
  };
  
  const defaultSleetThresholds: PrecipitationThresholds = {
    enabled: true,
    thresholdPercentage: 50,
    amountThreshold: 0.25
  };
  
  const defaultHailThresholds: PrecipitationThresholds = {
    enabled: true,
    thresholdPercentage: 30,
    amountThreshold: 0.1
  };
  
  const defaultWindThresholds: WindThresholds = {
    enabled: true,
    thresholdMph: 20
  };
  
  const defaultTemperatureThresholds: TemperatureThresholds = {
    enabled: true,
    minThresholdFahrenheit: 32,
    maxThresholdFahrenheit: 95
  };
  
  const defaultSpecialAlertThresholds: SpecialAlertThresholds = {
    enabled: true,
    includeStorms: true,
    includeLightning: true,
    includeFlooding: true,
    includeExtreme: true
  };
  
  const defaultAirQualityThresholds: AirQualityThresholds = {
    enabled: false,
    thresholdIndex: 150
  };
  
  return {
    isEnabled: true,
    checkTime: 'daily',
    checkTimeDaily: '06:00',
    timezone: 'America/New_York',
    forecastTimeframe: {
      hoursAhead: 24,
      workingHoursOnly: true,
      workingHoursStart: '07:00',
      workingHoursEnd: '17:00',
      includeDayBefore: true,
      checkDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    alertThresholds: {
      rain: defaultRainThresholds,
      snow: defaultSnowThresholds,
      sleet: defaultSleetThresholds,
      hail: defaultHailThresholds,
      wind: defaultWindThresholds,
      temperature: defaultTemperatureThresholds,
      specialAlerts: defaultSpecialAlertThresholds,
      airQuality: defaultAirQualityThresholds
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
 * Get default notification recipients
 */
function getDefaultRecipients(): NotificationRecipient[] {
  const user = auth.currentUser;
  if (!user || !user.email) {
    return [];
  }
  
  return [
    {
      id: 'owner',
      name: user.displayName || 'Account Owner',
      email: user.email,
      role: 'owner' as const,
      notificationMethods: {
        email: true,
        sms: false,
        push: false
      }
    }
  ];
}

// // src/services/weatherNotificationService.ts
// import { 
//   doc, 
//   getDoc, 
//   setDoc, 
//   updateDoc, 
//   collection, 
//   query, 
//   where, 
//   getDocs,
//   serverTimestamp 
// } from 'firebase/firestore';
// import { db, auth } from '../lib/firebaseClient';
// import { WeatherSettings, JobsiteWeatherSettings } from '../types/weather';

// /**
//  * Default weather notification settings
//  */
// export const defaultWeatherSettings: WeatherSettings = {
//   isEnabled: true,
//   checkTime: "06:00", // 6 AM
//   forecastTimeframe: {
//     hoursAhead: 12,
//     workingHoursOnly: true,
//     workingHoursStart: "07:00", // 7 AM
//     workingHoursEnd: "17:00", // 5 PM
//     includeDayBefore: true,
//     checkDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
//   },
//   alertThresholds: {
//     rain: {
//       enabled: true,
//       thresholdPercentage: 50,
//       amountThreshold: 0.25
//     },
//     snow: {
//       enabled: true,
//       thresholdPercentage: 40,
//       amountThreshold: 1.0
//     },
//     sleet: {
//       enabled: true,
//       thresholdPercentage: 40,
//       amountThreshold: 0.1
//     },
//     hail: {
//       enabled: true,
//       thresholdPercentage: 30,
//       amountThreshold: 0.1
//     },
//     wind: {
//       enabled: true,
//       thresholdMph: 20
//     },
//     temperature: {
//       enabled: true,
//       minThresholdFahrenheit: 32,
//       maxThresholdFahrenheit: 95
//     },
//     specialAlerts: {
//       enabled: true,
//       includeStorms: true,
//       includeLightning: true,
//       includeFlooding: true,
//       includeExtreme: true
//     },
//     airQuality: {
//       enabled: false,
//       thresholdIndex: 150
//     }
//   },
//   notificationSettings: {
//     notifyClient: true,
//     notifyWorkers: true,
//     notificationLeadHours: 12,
//     dailySummary: true,
//     recipients: []
//   }
// };

// /**
//  * Default jobsite weather settings
//  */
// export const defaultJobsiteWeatherSettings: JobsiteWeatherSettings = {
//   ...defaultWeatherSettings,
//   useGlobalDefaults: true,
//   overrideGlobalSettings: false
// };

// /**
//  * Get global weather notification settings for the current user
//  */
// export async function getGlobalWeatherSettings(): Promise<WeatherSettings> {
//   try {
//     const user = auth.currentUser;
//     if (!user) throw new Error('Not authenticated');

//     const settingsRef = doc(db, 'user_settings', user.uid);
//     const settingsDoc = await getDoc(settingsRef);
    
//     if (!settingsDoc.exists() || !settingsDoc.data().weatherSettings) {
//       // If no settings exist, create default settings
//       await setDoc(settingsRef, {
//         weatherSettings: defaultWeatherSettings,
//         updated_at: serverTimestamp()
//       }, { merge: true });
      
//       return defaultWeatherSettings;
//     }
    
//     return settingsDoc.data().weatherSettings as WeatherSettings;
//   } catch (error) {
//     console.error('Error fetching global weather settings:', error);
//     return defaultWeatherSettings;
//   }
// }

// /**
//  * Save global weather notification settings for the current user
//  */
// export async function saveGlobalWeatherSettings(settings: WeatherSettings): Promise<boolean> {
//   try {
//     const user = auth.currentUser;
//     if (!user) throw new Error('Not authenticated');

//     const settingsRef = doc(db, 'user_settings', user.uid);
    
//     await updateDoc(settingsRef, {
//       weatherSettings: settings,
//       updated_at: serverTimestamp()
//     });
    
//     return true;
//   } catch (error) {
//     console.error('Error saving global weather settings:', error);
//     return false;
//   }
// }

// /**
//  * Get jobsite-specific weather notification settings
//  */
// export async function getJobsiteWeatherSettings(jobsiteId: string): Promise<JobsiteWeatherSettings> {
//   try {
//     const user = auth.currentUser;
//     if (!user) throw new Error('Not authenticated');

//     // First, get the jobsite to verify ownership
//     const jobsiteRef = doc(db, 'jobsites', jobsiteId);
//     const jobsiteDoc = await getDoc(jobsiteRef);
    
//     if (!jobsiteDoc.exists()) {
//       throw new Error('Jobsite not found');
//     }
    
//     const jobsiteData = jobsiteDoc.data();
    
//     // Verify the jobsite belongs to the current user
//     if (jobsiteData.user_id !== user.uid) {
//       throw new Error('Unauthorized access to jobsite');
//     }
    
//     // Get the weather settings for this jobsite
//     if (!jobsiteData.weather_settings) {
//       // If no settings exist, create default settings
//       const globalSettings = await getGlobalWeatherSettings();
//       const defaultSettings: JobsiteWeatherSettings = {
//         ...globalSettings,
//         useGlobalDefaults: true,
//         overrideGlobalSettings: false
//       };
      
//       await updateDoc(jobsiteRef, {
//         weather_settings: defaultSettings,
//         updated_at: serverTimestamp()
//       });
      
//       return defaultSettings;
//     }
    
//     return jobsiteData.weather_settings as JobsiteWeatherSettings;
//   } catch (error) {
//     console.error(`Error fetching weather settings for jobsite ${jobsiteId}:`, error);
//     return defaultJobsiteWeatherSettings;
//   }
// }

// /**
//  * Save jobsite-specific weather notification settings
//  */
// export async function saveJobsiteWeatherSettings(
//   jobsiteId: string, 
//   settings: JobsiteWeatherSettings
// ): Promise<boolean> {
//   try {
//     const user = auth.currentUser;
//     if (!user) throw new Error('Not authenticated');

//     // First, get the jobsite to verify ownership
//     const jobsiteRef = doc(db, 'jobsites', jobsiteId);
//     const jobsiteDoc = await getDoc(jobsiteRef);
    
//     if (!jobsiteDoc.exists()) {
//       throw new Error('Jobsite not found');
//     }
    
//     const jobsiteData = jobsiteDoc.data();
    
//     // Verify the jobsite belongs to the current user
//     if (jobsiteData.user_id !== user.uid) {
//       throw new Error('Unauthorized access to jobsite');
//     }
    
//     // Save the weather settings for this jobsite
//     await updateDoc(jobsiteRef, {
//       weather_settings: settings,
//       updated_at: serverTimestamp()
//     });
    
//     return true;
//   } catch (error) {
//     console.error(`Error saving weather settings for jobsite ${jobsiteId}:`, error);
//     return false;
//   }
// }

// /**
//  * Get notification recipients for the current user
//  */
// export async function getNotificationRecipients() {
//   try {
//     const user = auth.currentUser;
//     if (!user) throw new Error('Not authenticated');

//     // Query workers and clients that belong to this user
//     const workersQuery = query(
//       collection(db, 'workers'),
//       where('user_id', '==', user.uid)
//     );
    
//     const clientsQuery = query(
//       collection(db, 'clients'),
//       where('user_id', '==', user.uid)
//     );
    
//     const [workersSnapshot, clientsSnapshot] = await Promise.all([
//       getDocs(workersQuery),
//       getDocs(clientsQuery)
//     ]);
    
//     const recipients = [];
    
//     // Add workers
//     workersSnapshot.forEach(doc => {
//       const worker = doc.data();
//       recipients.push({
//         id: doc.id,
//         name: worker.name || worker.full_name || '',
//         email: worker.email || '',
//         phone: worker.phone || '',
//         role: 'worker' as const,
//         notificationMethods: {
//           email: true,
//           sms: !!worker.phone,
//           push: false
//         }
//       });
//     });
    
//     // Add clients
//     clientsSnapshot.forEach(doc => {
//       const client = doc.data();
//       recipients.push({
//         id: doc.id,
//         name: client.name || client.company || '',
//         email: client.email || '',
//         phone: client.phone || '',
//         role: 'client' as const,
//         notificationMethods: {
//           email: true,
//           sms: !!client.phone,
//           push: false
//         }
//       });
//     });
    
//     // Add the user as owner
//     recipients.push({
//       id: user.uid,
//       name: user.displayName || 'Owner',
//       email: user.email || '',
//       role: 'owner' as const,
//       notificationMethods: {
//         email: true,
//         sms: false,
//         push: true
//       }
//     });
    
//     return recipients;
//   } catch (error) {
//     console.error('Error fetching notification recipients:', error);
//     return [];
//   }
// }

// /**
//  * Preview notifications based on current weather and settings
//  */
// export async function previewNotifications(
//   settings: WeatherSettings,
//   jobsiteId?: string
// ): Promise<{
//   wouldTrigger: boolean;
//   conditions: string[];
//   recipients: string[];
// }> {
//   try {
//     // This would typically call the weather API to get current conditions
//     // and then check if they would trigger notifications based on the settings
//     // For now, we'll return a mock response
    
//     const mockConditions = ['rain', 'wind'];
//     const mockRecipients = ['Owner', 'Site Manager', 'Client'];
    
//     return {
//       wouldTrigger: true,
//       conditions: mockConditions,
//       recipients: mockRecipients
//     };
//   } catch (error) {
//     console.error('Error previewing notifications:', error);
//     return {
//       wouldTrigger: false,
//       conditions: [],
//       recipients: []
//     };
//   }
// }
