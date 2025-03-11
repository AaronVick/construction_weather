// api/consolidated/admin/test-email.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('SendGrid API initialized in consolidated endpoint');
} else {
  console.error('SENDGRID_API_KEY not found in environment for consolidated endpoint');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed in consolidated endpoint`);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Consolidated admin/test-email endpoint called');

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
    
    // Check if the user is an admin
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
    
    if (!isAdmin) {
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
    
    // Validate request
    if (!testEmailRecipients || !Array.isArray(testEmailRecipients) || testEmailRecipients.length === 0) {
      return res.status(400).json({ error: 'At least one email recipient is required' });
    }
    
    if (!emailSubject) {
      return res.status(400).json({ error: 'Email subject is required' });
    }
    
    if (!emailBody) {
      return res.status(400).json({ error: 'Email body is required' });
    }
    
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
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
    
    // Send the email
    const response = await sgMail.send(emailData);
    
    // Log the email send
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
    console.error('Error in consolidated test-email endpoint:', error);
    
    
    // Handle SendGrid-specific errors
    const sendgridError = error as any;
    if (sendgridError && sendgridError.response && sendgridError.response.body) {
      console.error('SendGrid API Error:', sendgridError.response.body);
      return res.status(500).json({ 
        success: false,
        error: 'SendGrid API Error',
        message: error instanceof Error ? error.message : String(error),
        details: sendgridError.response.body
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send test email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
