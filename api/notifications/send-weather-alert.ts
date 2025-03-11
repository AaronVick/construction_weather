// api/notifications/send-weather-alert.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import { checkWeatherForNotifications } from '../../src/services/weatherService';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('SENDGRID_API_KEY is not set');
}

// Define types for notification recipients
interface NotificationRecipient {
  email: string;
  name?: string;
  type: 'owner' | 'manager' | 'worker' | 'client';
  jobsiteId: string;
  userId?: string;
}

// Define types for notification tracking
interface NotificationRecord {
  jobsite_id: string;
  recipient_email: string;
  recipient_type: string;
  conditions: string[];
  weather_description: string;
  sent_at: FirebaseFirestore.Timestamp;
  status: 'sent' | 'failed';
  error?: string;
  message_id?: string;
}

/**
 * API endpoint to send weather alert notifications
 * 
 * POST /api/notifications/send-weather-alert
 * 
 * Request body:
 * - jobsiteId: string (optional) - Send notifications for a specific jobsite
 * - userId: string (optional) - Send notifications for all jobsites of a user
 * - checkAll: boolean (optional) - Send notifications for all jobsites in the system
 * - dryRun: boolean (optional) - Don't actually send emails, just return what would be sent
 * - force: boolean (optional) - Send notifications even if conditions don't meet thresholds
 * 
 * Response:
 * - results: Array of notification results
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
    const { jobsiteId, userId: targetUserId, checkAll, dryRun, force } = req.body;
    
    // Validate request
    if (!jobsiteId && !targetUserId && !checkAll) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Provide jobsiteId, userId, or checkAll=true' 
      });
    }
    
    // Non-admins can only send notifications for their own jobsites
    if ((targetUserId && targetUserId !== userId) || checkAll) {
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Permission denied. Only admins can send notifications for other users\' jobsites or all jobsites' 
        });
      }
    }
    
    // Define interface for jobsite data
    interface JobsiteData {
      id: string;
      name: string;
      user_id: string;
      is_active: boolean;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
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
      [key: string]: any;
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
      
      const jobsiteData = jobsiteDoc.data() as JobsiteData;
      
      // Verify ownership or admin status
      if (jobsiteData.user_id !== userId && !isAdmin) {
        return res.status(403).json({ 
          error: 'Permission denied. You do not have access to this jobsite' 
        });
      }
      
      jobsitesToCheck.push({
        ...jobsiteData,
        id: jobsiteId
      });
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
        const data = doc.data() as Omit<JobsiteData, 'id'>;
        return {
          ...data,
          id: doc.id,
          name: data.name || 'Unknown Jobsite',
          user_id: data.user_id || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        } as JobsiteData;
      });
    }
    
  // Check weather conditions and send notifications
  const results = await Promise.all(
    jobsitesToCheck.map(async (jobsite) => {
      try {
        // Ensure jobsite has required properties
        if (!jobsite || !jobsite.id || !jobsite.name || !jobsite.user_id) {
          return {
            jobsiteId: jobsite?.id || 'unknown',
            name: jobsite?.name || 'Unknown Jobsite',
            status: 'error',
            reason: 'Invalid jobsite data'
          };
        }

        // Skip jobsites without weather monitoring enabled
        if (!jobsite.weather_monitoring?.enabled) {
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            status: 'skipped',
            reason: 'Weather monitoring not enabled'
          };
        }
        
        // Check if notifications are enabled
        if (!jobsite.weather_monitoring?.notifications?.enabled) {
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            status: 'skipped',
            reason: 'Weather notifications not enabled'
          };
        }
        
        // Check weather conditions
        const checkResult = await checkWeatherForNotifications(jobsite.id);
        
        // Skip if no notification needed and not forced
        if (!checkResult.shouldSendNotification && !force) {
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            status: 'skipped',
            reason: 'No weather conditions requiring notification'
          };
        }
        
        // Get notification recipients
        const recipients = await getNotificationRecipients(jobsite);
        
        if (recipients.length === 0) {
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            status: 'skipped',
            reason: 'No notification recipients configured'
          };
        }
          
          // Check for recent notifications to avoid duplicates
          const recentNotifications = await db.collection('weather_notifications')
            .where('jobsite_id', '==', jobsite.id)
            .where('sent_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
            .get();
          
          if (recentNotifications.size > 0 && !force) {
            return {
              jobsiteId: jobsite.id,
              name: jobsite.name,
              status: 'skipped',
              reason: 'Notification already sent in the last 24 hours'
            };
          }
          
          // Send notifications
          const notificationResults = await sendNotifications(
            jobsite, 
            recipients, 
            checkResult.conditions, 
            checkResult.weatherDescription,
            checkResult.weatherData,
            dryRun
          );
          
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
            status: dryRun ? 'dry_run' : 'sent',
            recipients: notificationResults
          };
        } catch (error) {
          console.error(`Error sending notifications for jobsite ${jobsite.id}:`, error);
          
          return {
            jobsiteId: jobsite.id,
            name: jobsite.name,
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
        sent: results.filter(r => r.status === 'sent').length,
        dryRun: results.filter(r => r.status === 'dry_run').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Error sending weather notifications:', error);
    
    return res.status(500).json({ 
      error: 'Failed to send weather notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get notification recipients for a jobsite
 */
async function getNotificationRecipients(jobsite: any): Promise<NotificationRecipient[]> {
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
 * Send weather notifications to recipients
 */
async function sendNotifications(
  jobsite: any, 
  recipients: NotificationRecipient[], 
  conditions: string[], 
  weatherDescription: string,
  weatherData: any,
  dryRun: boolean = false
): Promise<any[]> {
  const results = [];
  
  // Get email template ID based on conditions
  const templateId = getEmailTemplateId(conditions);
  
  // Batch notifications by recipient type
  const recipientsByType: Record<string, NotificationRecipient[]> = {};
  
  for (const recipient of recipients) {
    if (!recipientsByType[recipient.type]) {
      recipientsByType[recipient.type] = [];
    }
    
    recipientsByType[recipient.type].push(recipient);
  }
  
  // Send notifications by type
  for (const [type, typeRecipients] of Object.entries(recipientsByType)) {
    // Batch recipients into groups of 1000 (SendGrid limit)
    const batchSize = 1000;
    const batches = [];
    
    for (let i = 0; i < typeRecipients.length; i += batchSize) {
      batches.push(typeRecipients.slice(i, i + batchSize));
    }
    
    // Process each batch
    for (const batch of batches) {
      try {
        // Prepare email data
        const emailData = {
          templateId,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
            name: process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
          },
          personalizations: batch.map(recipient => ({
            to: [
              {
                email: recipient.email,
                name: recipient.name
              }
            ],
            dynamicTemplateData: {
              jobsite_name: jobsite.name,
              jobsite_address: jobsite.address,
              jobsite_city: jobsite.city,
              jobsite_state: jobsite.state,
              jobsite_zip: jobsite.zip_code,
              weather_conditions: conditions.join(', '),
              weather_description: weatherDescription,
              current_temperature: weatherData?.current?.temperature,
              forecast_high: weatherData?.forecast?.temperature?.max,
              forecast_low: weatherData?.forecast?.temperature?.min,
              precipitation_chance: weatherData?.forecast?.precipitationProbability,
              wind_speed: weatherData?.forecast?.windSpeed,
              recipient_type: type,
              recipient_name: recipient.name,
              unsubscribe_url: `${process.env.APP_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}&type=weather`
            }
          }))
        };
        
        if (dryRun) {
          // Don't actually send emails in dry run mode
          for (const recipient of batch) {
            results.push({
              email: recipient.email,
              type: recipient.type,
              status: 'dry_run'
            });
          }
        } else {
          // Send the emails
          const response = await sgMail.send(emailData);
          
          // Record notifications in the database
          const notificationRecords: NotificationRecord[] = batch.map(recipient => ({
            jobsite_id: jobsite.id,
            recipient_email: recipient.email,
            recipient_type: recipient.type,
            conditions,
            weather_description: weatherDescription,
            sent_at: admin.firestore.Timestamp.now(),
            status: 'sent',
            message_id: response[0]?.headers['x-message-id']
          }));
          
          // Batch write to Firestore
          const batchWrite = db.batch();
          
          for (const record of notificationRecords) {
            const docRef = db.collection('weather_notifications').doc();
            batchWrite.set(docRef, record);
          }
          
          await batchWrite.commit();
          
          // Add results
          for (const recipient of batch) {
            results.push({
              email: recipient.email,
              type: recipient.type,
              status: 'sent'
            });
          }
        }
      } catch (error) {
        console.error(`Error sending batch notifications:`, error);
        
        // Record failed notifications
        for (const recipient of batch) {
          results.push({
            email: recipient.email,
            type: recipient.type,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          if (!dryRun) {
            // Record failure in the database
            await db.collection('weather_notifications').add({
              jobsite_id: jobsite.id,
              recipient_email: recipient.email,
              recipient_type: recipient.type,
              conditions,
              weather_description: weatherDescription,
              sent_at: admin.firestore.Timestamp.now(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }
  }
  
  return results;
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
