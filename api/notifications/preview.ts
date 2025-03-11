// api/notifications/preview.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import { checkWeatherForNotifications } from '../../src/services/weatherService';

// Define types for notification recipients
interface NotificationRecipient {
  email: string;
  name?: string;
  type: 'owner' | 'manager' | 'worker' | 'client';
  jobsiteId: string;
  userId?: string;
}

// Define types for jobsite data
interface JobsiteData {
  id: string;
  name: string;
  user_id: string;
  address?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  managers?: Array<{
    email: string;
    name?: string;
  }>;
  workers?: Array<{
    email: string;
    name?: string;
  }>;
  client?: {
    email: string;
    name?: string;
  };
  weather_monitoring?: {
    enabled: boolean;
    notifications?: {
      enabled: boolean;
      notifyOwner?: boolean;
      notifyManagers?: boolean;
      notifyWorkers?: boolean;
      notifyClients?: boolean;
    };
  };
  [key: string]: any;
}

/**
 * API endpoint to preview weather notifications
 * 
 * GET /api/notifications/preview
 * 
 * Query parameters:
 * - jobsiteId: string - The jobsite to preview notifications for
 * 
 * Response:
 * - preview: Object containing notification preview data
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
    
    // Get jobsite ID from query parameters
    const { jobsiteId } = req.query;
    
    if (!jobsiteId || typeof jobsiteId !== 'string') {
      return res.status(400).json({ error: 'Jobsite ID is required' });
    }
    
    // Get jobsite data
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
    
    // Create jobsite object with ID
    const jobsite: JobsiteData = {
      id: jobsiteId,
      name: jobsiteData.name,
      user_id: jobsiteData.user_id,
      is_active: jobsiteData.is_active,
      ...jobsiteData
    };
    
    // Check if weather monitoring is enabled
    if (!jobsite.weather_monitoring?.enabled) {
      return res.status(400).json({ 
        error: 'Weather monitoring is not enabled for this jobsite',
        preview: {
          jobsite: {
            id: jobsite.id,
            name: jobsite.name,
            address: jobsite.address,
            city: jobsite.city,
            state: jobsite.state,
            zip_code: jobsite.zip_code
          },
          status: 'not_enabled',
          message: 'Weather monitoring is not enabled for this jobsite'
        }
      });
    }
    
    // Check if notifications are enabled
    if (!jobsite.weather_monitoring.notifications?.enabled) {
      return res.status(400).json({ 
        error: 'Weather notifications are not enabled for this jobsite',
        preview: {
          jobsite: {
            id: jobsite.id,
            name: jobsite.name,
            address: jobsite.address,
            city: jobsite.city,
            state: jobsite.state,
            zip_code: jobsite.zip_code
          },
          status: 'notifications_disabled',
          message: 'Weather notifications are not enabled for this jobsite'
        }
      });
    }
    
    // Check weather conditions
    const checkResult = await checkWeatherForNotifications(jobsiteId);
    
    // Get notification recipients
    const recipients = await getNotificationRecipients(jobsite);
    
    // Get email template ID based on conditions
    const templateId = getEmailTemplateId(checkResult.conditions);
    
    // Create preview data
    const previewData = {
      jobsite: {
        id: jobsite.id,
        name: jobsite.name,
        address: jobsite.address,
        city: jobsite.city,
        state: jobsite.state,
        zip_code: jobsite.zip_code
      },
      weather: {
        conditions: checkResult.conditions,
        description: checkResult.weatherDescription,
        current: checkResult.weatherData?.current,
        forecast: checkResult.weatherData?.forecast
      },
      notification: {
        shouldSend: checkResult.shouldSendNotification,
        templateId,
        recipients: recipients.map(r => ({
          email: r.email,
          name: r.name,
          type: r.type
        })),
        recipientCount: recipients.length,
        recipientsByType: {
          owner: recipients.filter(r => r.type === 'owner').length,
          manager: recipients.filter(r => r.type === 'manager').length,
          worker: recipients.filter(r => r.type === 'worker').length,
          client: recipients.filter(r => r.type === 'client').length
        }
      },
      emailPreview: {
        subject: getEmailSubject(checkResult.conditions),
        dynamicTemplateData: {
          jobsite_name: jobsite.name,
          jobsite_address: jobsite.address,
          jobsite_city: jobsite.city,
          jobsite_state: jobsite.state,
          jobsite_zip: jobsite.zip_code,
          weather_conditions: checkResult.conditions.join(', '),
          weather_description: checkResult.weatherDescription,
          current_temperature: checkResult.weatherData?.current?.temperature,
          forecast_high: checkResult.weatherData?.forecast?.temperature?.max,
          forecast_low: checkResult.weatherData?.forecast?.temperature?.min,
          precipitation_chance: checkResult.weatherData?.forecast?.precipitationProbability,
          wind_speed: checkResult.weatherData?.forecast?.windSpeed
        }
      }
    };
    
    // Return the preview data
    return res.status(200).json({ preview: previewData });
  } catch (error) {
    console.error('Error generating notification preview:', error);
    
    return res.status(500).json({ 
      error: 'Failed to generate notification preview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get notification recipients for a jobsite
 */
async function getNotificationRecipients(jobsite: JobsiteData): Promise<NotificationRecipient[]> {
  const recipients: NotificationRecipient[] = [];
  
  // Add owner
  if (jobsite.weather_monitoring?.notifications?.notifyOwner) {
    const ownerRef = db.collection('users').doc(jobsite.user_id);
    const ownerDoc = await ownerRef.get();
    
    if (ownerDoc.exists) {
      const ownerData = ownerDoc.data();
      
      if (ownerData && ownerData.email) {
        recipients.push({
          email: ownerData.email,
          name: ownerData.displayName || ownerData.email,
          type: 'owner',
          jobsiteId: jobsite.id,
          userId: jobsite.user_id
        });
      }
    }
  }
  
  // Add managers
  if (jobsite.weather_monitoring?.notifications?.notifyManagers && 
      jobsite.managers && 
      Array.isArray(jobsite.managers)) {
    
    for (const manager of jobsite.managers) {
      if (manager.email) {
        recipients.push({
          email: manager.email,
          name: manager.name || manager.email,
          type: 'manager',
          jobsiteId: jobsite.id
        });
      }
    }
  }
  
  // Add workers
  if (jobsite.weather_monitoring?.notifications?.notifyWorkers && 
      jobsite.workers && 
      Array.isArray(jobsite.workers)) {
    
    for (const worker of jobsite.workers) {
      if (worker.email) {
        recipients.push({
          email: worker.email,
          name: worker.name || worker.email,
          type: 'worker',
          jobsiteId: jobsite.id
        });
      }
    }
  }
  
  // Add clients
  if (jobsite.weather_monitoring?.notifications?.notifyClients && 
      jobsite.client && 
      jobsite.client.email) {
    
    recipients.push({
      email: jobsite.client.email,
      name: jobsite.client.name || jobsite.client.email,
      type: 'client',
      jobsiteId: jobsite.id
    });
  }
  
  return recipients;
}

/**
 * Get the appropriate email template ID based on weather conditions
 */
function getEmailTemplateId(conditions: string[]): string {
  // Default template
  const defaultTemplateId = process.env.SENDGRID_WEATHER_TEMPLATE_ID || 'd-default-weather-template-id';
  
  // Check for specific conditions
  if (conditions.includes('extreme_conditions') || conditions.includes('weather_alert')) {
    return process.env.SENDGRID_EXTREME_WEATHER_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('snow')) {
    return process.env.SENDGRID_SNOW_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('rain') || conditions.includes('any_rain')) {
    return process.env.SENDGRID_RAIN_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('wind')) {
    return process.env.SENDGRID_WIND_TEMPLATE_ID || defaultTemplateId;
  }
  
  if (conditions.includes('temperature')) {
    return process.env.SENDGRID_TEMPERATURE_TEMPLATE_ID || defaultTemplateId;
  }
  
  return defaultTemplateId;
}

/**
 * Get email subject based on weather conditions
 */
function getEmailSubject(conditions: string[]): string {
  // Default subject
  let subject = 'Weather Alert for Your Jobsite';
  
  // Check for specific conditions
  if (conditions.includes('extreme_conditions') || conditions.includes('weather_alert')) {
    subject = 'URGENT: Extreme Weather Alert for Your Jobsite';
  } else if (conditions.includes('snow')) {
    subject = 'Snow Alert for Your Jobsite';
  } else if (conditions.includes('rain') || conditions.includes('any_rain')) {
    subject = 'Rain Alert for Your Jobsite';
  } else if (conditions.includes('wind')) {
    subject = 'High Wind Alert for Your Jobsite';
  } else if (conditions.includes('temperature')) {
    subject = 'Temperature Alert for Your Jobsite';
  }
  
  return subject;
}
