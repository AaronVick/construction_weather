// api/consolidated/admin/test-email.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../../src/lib/firebaseAdmin'; // Fixed import path
import sgMail from '@sendgrid/mail';
import { ClientResponse } from '@sendgrid/client/src/response';
// Removed unused Mail import

// Define interfaces for type safety
interface SendEmailResponseDetails {
  statusCode?: number;
  headers?: Record<string, string>;
  messageId?: string;
}

interface SendEmailResponse {
  success: boolean;
  message: string;
  details?: SendEmailResponseDetails | Record<string, any>;
  error?: string;
}

// Initialize SendGrid - try both possible env var names
const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API;
if (apiKey) {
  sgMail.setApiKey(apiKey);
  console.log('SendGrid API initialized with key from environment');
} else {
  console.error('SendGrid API key not found in any environment variable');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed in test-email endpoint`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Test email endpoint called');

  // Log environment variables (without exposing values)
  console.log('Environment check:');
  console.log('- SENDGRID_API_KEY exists:', Boolean(process.env.SENDGRID_API_KEY));
  console.log('- SENDGRID_API exists:', Boolean(process.env.SENDGRID_API));
  console.log('- SENDGRID_FROM_EMAIL exists:', Boolean(process.env.SENDGRID_FROM_EMAIL));
  console.log('- SENDGRID_FROM_NAME exists:', Boolean(process.env.SENDGRID_FROM_NAME));

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: No valid Bearer token provided');
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');
    
    try {
      // Verify the token and get the user
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log(`Token verified for user: ${userId}`);
      
      try {
        // Check if the user exists
        const userRecord = await auth.getUser(userId);
        console.log(`User record found: ${userRecord.email}`);
        
        try {
          // Check if the user is an admin
          const userRef = db.collection('user_profiles').doc(userId);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            console.error('User profile not found');
            return res.status(403).json({ error: 'Permission denied. User profile not found.' });
          }
          
          const userData = userDoc.data();
          const isAdmin = userData?.role === 'admin';
          console.log(`User admin status: ${isAdmin}`);
          
          if (!isAdmin) {
            console.error('User is not an admin');
            return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
          }
          
          // Get request body
          const {
            testEmailRecipients,
            emailSubject,
            emailBody,
            fromEmail,
            fromName
          } = req.body;
          
          console.log('Email request details:', {
            recipients: Array.isArray(testEmailRecipients) ? testEmailRecipients.join(', ') : testEmailRecipients,
            subject: emailSubject,
            fromEmail: fromEmail || '(using default)',
            fromName: fromName || '(using default)'
          });
          
          // Validate request
          if (!testEmailRecipients || !Array.isArray(testEmailRecipients) || testEmailRecipients.length === 0) {
            console.error('Invalid recipients:', testEmailRecipients);
            return res.status(400).json({ error: 'At least one email recipient is required' });
          }
          
          if (!emailSubject) {
            console.error('Missing email subject');
            return res.status(400).json({ error: 'Email subject is required' });
          }
          
          if (!emailBody) {
            console.error('Missing email body');
            return res.status(400).json({ error: 'Email body is required' });
          }
          
          // Check if SendGrid is configured
          const currentApiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API;
          if (!currentApiKey) {
            console.error('SendGrid API key not configured');
            return res.status(500).json({ 
              success: false,
              error: 'SendGrid API key not configured',
              message: 'SendGrid API key not found in environment variables. Please check your configuration.'
            });
          }
          
          // Re-initialize with current API key (in case it changed)
          sgMail.setApiKey(currentApiKey);
          
          // Prepare email data
          const from = {
            email: fromEmail || process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com',
            name: fromName || process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts'
          };
          
          const to = testEmailRecipients.map((email: string) => ({
            email,
            name: email
          }));
          
          const emailData = {
            from,
            to,
            subject: emailSubject,
            text: emailBody,
            html: emailBody.replace(/\n/g, '<br>')
          };
          
          console.log('Sending email with configuration:', {
            from: from.email,
            to: to.map(recipient => recipient.email).join(', '),
            subject: emailSubject
          });
          
          // Send the email with proper timeout handling
          const sendEmailPromise = sgMail.send(emailData);
          
          // Create a timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('SendGrid API request timed out after 10 seconds')), 10000);
          });
          
          try {
            // Race the email send against the timeout
            const response = await Promise.race([sendEmailPromise, timeoutPromise]) as [ClientResponse, {}];
            console.log('SendGrid API response status:', response[0]?.statusCode);
            
            // Log the email send to database
            try {
              await db.collection('email_logs').add({
                user_id: userId,
                sentAt: new Date(),
                subject: emailSubject,
                body: emailBody,
                recipients: testEmailRecipients,
                status: 'sent',
                trigger: 'test',
                fromEmail: from.email,
                fromName: from.name
              });
              console.log('Email log saved to database');
            } catch (logError) {
              console.error('Error saving email log:', logError);
              // Continue even if logging fails
            }
            
            const successResponse: SendEmailResponse = {
              success: true,
              message: `Test email sent successfully to ${testEmailRecipients.join(', ')}`,
              details: {
                statusCode: response[0]?.statusCode,
                headers: response[0]?.headers,
                messageId: response[0]?.headers['x-message-id']
              }
            };
            
            return res.status(200).json(successResponse);
          } catch (sendError: any) {
            console.error('Error sending email:', sendError);
            
            // Prepare error response with proper type
            let errorResponse: SendEmailResponse;
            
            // Handle timeout error
            if (sendError.message?.includes('timed out')) {
              errorResponse = {
                success: false,
                error: 'SendGrid API Timeout',
                message: 'The request to SendGrid API timed out. This may indicate network issues or API key problems.',
                details: {
                  error: sendError.message
                }
              };
              return res.status(500).json(errorResponse);
            }
            
            // Handle SendGrid-specific errors
            if (sendError?.response?.body) {
              console.error('SendGrid API Error Details:', sendError.response.body);
              errorResponse = {
                success: false,
                error: 'SendGrid API Error',
                message: sendError.message || 'Failed to send email',
                details: sendError.response.body
              };
              return res.status(500).json(errorResponse);
            }
            
            // Generic error fallback
            errorResponse = {
              success: false,
              error: 'Failed to send test email',
              message: sendError.message || 'Unknown SendGrid error'
            };
            return res.status(500).json(errorResponse);
          }
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);
          return res.status(500).json({ error: 'Failed to check user permissions' });
        }
      } catch (userError) {
        console.error('Error getting user record:', userError);
        return res.status(500).json({ error: 'Error retrieving user data' });
      }
    } catch (tokenError) {
      console.error('Error verifying token:', tokenError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Unhandled error in test-email endpoint:', error);
    
    const errorResponse: SendEmailResponse = {
      success: false,
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return res.status(500).json(errorResponse);
  }
}