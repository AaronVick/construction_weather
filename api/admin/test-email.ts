// api/admin/test-email.ts with improved error handling
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with better error handling
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API key configured successfully');
} else {
  console.error('WARNING: SENDGRID_API_KEY not found in environment variables');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed, only POST is supported`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log important environment variables (without revealing secrets)
    console.log('Environment check:');
    console.log('- SENDGRID_API_KEY exists:', Boolean(process.env.SENDGRID_API_KEY));
    console.log('- SENDGRID_FROM_EMAIL exists:', Boolean(process.env.SENDGRID_FROM_EMAIL));
    console.log('- SENDGRID_FROM_NAME exists:', Boolean(process.env.SENDGRID_FROM_NAME));

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authentication failed: No valid Bearer token provided');
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, attempting verification...');
    
    // Verify the token and get the user
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log(`Token verified for user: ${userId}`);
      
      // Check if the user exists
      try {
        const userRecord = await auth.getUser(userId);
        if (!userRecord) {
          console.error(`User not found for ID: ${userId}`);
          return res.status(401).json({ error: 'User not found' });
        }
        console.log(`User record found: ${userRecord.email}`);
        
        // Check if the user is an admin
        try {
          const userRef = db.collection('user_profiles').doc(userId);
          const userDoc = await userRef.get();
          const userData = userDoc.data();
          console.log(`User data retrieved:`, userData ? 'exists' : 'not found');
          
          const isAdmin = userDoc.exists && userData?.role === 'admin';
          console.log(`User admin status: ${isAdmin}`);
          
          if (!isAdmin) {
            console.error(`Permission denied for user ${userId}: Not an admin`);
            return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
          }
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);
          return res.status(500).json({ error: 'Error checking user permissions' });
        }
      } catch (userError) {
        console.error('Error getting user record:', userError);
        return res.status(500).json({ error: 'Error retrieving user data' });
      }
    } catch (tokenError) {
      console.error('Error verifying token:', tokenError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get request body
    const {
      testEmailRecipients,
      emailSubject,
      emailBody,
      fromEmail,
      fromName
    } = req.body;
    
    console.log('Received email request:', {
      recipients: testEmailRecipients,
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
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key not configured');
      return res.status(500).json({ 
        error: 'SendGrid API key not configured',
        message: 'The SendGrid API key is not configured. Please add it to your environment variables.'
      });
    }
    
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
    
    // Send the email
    try {
      const response = await sgMail.send(emailData);
      console.log('SendGrid API response:', response[0]?.statusCode);
      
      // Log the email send
      try {
        await db.collection('email_logs').add({
          user_id: req.body.userId, // This should be set earlier from the token
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
      
      return res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${testEmailRecipients.join(', ')}`,
        details: {
          statusCode: response[0]?.statusCode,
          headers: response[0]?.headers,
          messageId: response[0]?.headers['x-message-id']
        }
      });
    } catch (error) {
      console.error('SendGrid error:', error);
      
      // Type assertion for SendGrid error
      const sendgridError = error as any;
      const sgErrorResponse = sendgridError.response?.body || {};
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to send test email via SendGrid',
        message: sendgridError.message || 'Unknown SendGrid error',
        details: sgErrorResponse
      });
    }
  } catch (error) {
    console.error('Unhandled error in test-email endpoint:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
