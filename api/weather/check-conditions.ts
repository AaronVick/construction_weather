// api/weather/check-conditions.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import { 
  checkWeatherForNotifications,
  fetchWeatherForecast,
  getCurrentWeather
} from '../../src/services/weatherService';
import { 
  checkWeatherConditions as checkConditions,
  analyzeHourlyForecast
} from '../../src/services/weatherTestService';

// Define types for jobsite data
interface JobsiteData {
  id: string;
  name: string;
  user_id: string;
  address?: string;
  zip_code?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  weather_monitoring?: {
    enabled: boolean;
    checkTime?: string;
    forecastTimeframe?: {
      checkDays?: string[];
      hoursAhead?: number;
      workingHoursOnly?: boolean;
      workingHoursStart?: string;
      workingHoursEnd?: string;
    };
    alertThresholds?: Record<string, any>;
  };
  [key: string]: any;
}

// Define types for check results
interface CheckResult {
  jobsiteId: string;
  name: string;
  location: string;
  status: 'notification_needed' | 'no_notification_needed' | 'skipped' | 'error';
  conditions?: string[];
  weatherDescription?: string;
  weatherData?: any;
  reason?: string;
  error?: string;
}

/**
 * API endpoint to check if weather conditions meet notification criteria
 * 
 * POST /api/weather/check-conditions
 * 
 * Request body:
 * - jobsiteId: string (optional) - Check specific jobsite
 * - userId: string (optional) - Check all jobsites for a user
 * - checkAll: boolean (optional) - Check all jobsites in the system
 * - dryRun: boolean (optional) - Don't record the check, just return results
 * 
 * Response:
 * - results: Array of jobsites with notification status
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
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user exists
    const userRecord = await auth.getUser(userId);
    if (!userRecord) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Get admin status
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
    
    // Get request parameters
    const { jobsiteId, userId: targetUserId, checkAll, dryRun } = req.body;
    
    // Validate request
    if (!jobsiteId && !targetUserId && !checkAll) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Provide jobsiteId, userId, or checkAll=true' 
      });
    }
    
    // Non-admins can only check their own jobsites
    if ((targetUserId && targetUserId !== userId) || checkAll) {
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Permission denied. Only admins can check other users\' jobsites or all jobsites' 
        });
      }
    }
    
    // Get jobsites to check
    let jobsitesToCheck: JobsiteData[] = [];
    
    if (jobsiteId) {
      // Check specific jobsite
      const jobsiteRef = db.collection('jobsites').doc(jobsiteId);
      const jobsiteDoc = await jobsiteRef.get();
      
      if (!jobsiteDoc.exists) {
        return res.status(404).json({ error: 'Jobsite not found' });
      }
      
      const jobsiteData = jobsiteDoc.data() as Omit<JobsiteData, 'id'>;
      
      // Verify ownership or admin status
      if (jobsiteData.user_id !== userId && !isAdmin) {
        return res.status(403).json({ 
          error: 'Permission denied. You do not have access to this jobsite' 
        });
      }
      
      const data = jobsiteDoc.data() || {};
      jobsitesToCheck.push({
        id: jobsiteId,
        name: data.name || 'Unnamed Jobsite',
        user_id: data.user_id || '',
        is_active: data.is_active || false,
        address: data.address || undefined,
        zip_code: data.zip_code || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        weather_monitoring: data.weather_monitoring || undefined,
        ...data
      } as JobsiteData);
    } else if (targetUserId || checkAll) {
      // Query for jobsites
      let jobsitesQuery;
      
      if (targetUserId) {
        // Get all jobsites for a specific user
        jobsitesQuery = db.collection('jobsites')
          .where('user_id', '==', targetUserId)
          .where('is_active', '==', true);
      } else {
        // Get all active jobsites in the system
        jobsitesQuery = db.collection('jobsites')
          .where('is_active', '==', true);
      }
      
      const jobsitesSnapshot = await jobsitesQuery.get();
      
      jobsitesToCheck = jobsitesSnapshot.docs.map(doc => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          name: data.name || 'Unnamed Jobsite',
          user_id: data.user_id || '',
          is_active: data.is_active || false,
          address: data.address || undefined,
          zip_code: data.zip_code || undefined,
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,
          weather_monitoring: data.weather_monitoring || undefined,
          ...data
        } as JobsiteData;
      });
    }
    
    // Check weather conditions for each jobsite
    const results: CheckResult[] = await Promise.all(
      jobsitesToCheck.map(async (jobsite: JobsiteData) => {
        try {
          // Skip jobsites without weather monitoring enabled
          if (!jobsite.weather_monitoring?.enabled) {
            return {
              jobsiteId: jobsite.id,
              name: jobsite.name,
              location: jobsite.address || jobsite.zip_code || 'Unknown',
              status: 'skipped',
              reason: 'Weather monitoring not enabled'
            };
          }
          
          // Check if we should skip based on notification settings
          const now = new Date();
          const checkTime = jobsite.weather_monitoring?.checkTime || '06:00';
          const [checkHour, checkMinute] = checkTime.split(':').map(Number);
          
          // Get the check days (default to weekdays)
          const checkDays = jobsite.weather_monitoring?.forecastTimeframe?.checkDays || 
                          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          
          // Get the current day of week (lowercase)
          const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          
          // Skip if not a check day
          if (!checkDays.includes(dayOfWeek)) {
            return {
              jobsiteId: jobsite.id,
              name: jobsite.name,
              location: jobsite.address || jobsite.zip_code || 'Unknown',
              status: 'skipped',
              reason: `Not a check day (${dayOfWeek})`
            };
          }
          
          // Check weather conditions
          const checkResult = await checkWeatherForNotifications(jobsite.id);
          
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            location: jobsite.address || jobsite.zip_code || 'Unknown',
            status: checkResult.shouldSendNotification ? 'notification_needed' : 'no_notification_needed',
            conditions: checkResult.conditions,
            weatherDescription: checkResult.weatherDescription,
            weatherData: checkResult.weatherData
          };
        } catch (error) {
          console.error(`Error checking weather for jobsite ${jobsite.id}:`, error);
          
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            location: jobsite.address || jobsite.zip_code || 'Unknown',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    // Return the results
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total: results.length,
        notificationNeeded: results.filter(r => r.status === 'notification_needed').length,
        noNotificationNeeded: results.filter(r => r.status === 'no_notification_needed').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Error checking weather conditions:', error);
    
    return res.status(500).json({ 
      error: 'Failed to check weather conditions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
