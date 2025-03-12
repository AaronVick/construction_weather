// .github/scripts/send-test-email.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sgMail from '@sendgrid/mail';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendTestEmail() {
  console.log('Starting email send process...');
  
  try {
    // Validate environment variables
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SendGrid API key is not configured');
    }
    
    // Set API key
    sgMail.setApiKey(apiKey);
    
    // Parse recipients
    const recipients = process.env.RECIPIENTS.split(',')
      .map(email => email.trim())
      .filter(email => email);
    
    if (recipients.length === 0) {
      throw new Error('No valid recipients provided');
    }
    
    // Prepare from details
    const fromEmail = process.env.CUSTOM_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com';
    const fromName = process.env.CUSTOM_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts';
    
    // Validate required fields
    if (!process.env.SUBJECT) {
      throw new Error('Email subject is required');
    }
    
    if (!process.env.BODY) {
      throw new Error('Email body is required');
    }
    
    // Prepare email
    const msg = {
      to: recipients,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: process.env.SUBJECT,
      text: process.env.BODY,
      html: process.env.BODY.replace(/\n/g, '<br>')
    };
    
    console.log('Sending email with configuration:');
    console.log('- To:', recipients.join(', '));
    console.log('- From:', `${fromName} <${fromEmail}>`);
    console.log('- Subject:', process.env.SUBJECT);
    
    // Send email
    const response = await sgMail.send(msg);
    
    // Prepare result
    const result = {
      success: true,
      message: `Email sent successfully to ${recipients.join(', ')}`,
      timestamp: new Date().toISOString(),
      details: {
        statusCode: response[0]?.statusCode,
        recipients: recipients,
        subject: process.env.SUBJECT
      }
    };
    
    // Save result to file
    fs.writeFileSync(path.join(process.cwd(), 'email-result.json'), JSON.stringify(result, null, 2));
    
    console.log('Email sent successfully!');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Prepare error result
    const errorResult = {
      success: false,
      error: 'Failed to send email',
      message: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      details: error.response?.body || {}
    };
    
    // Save error result to file
    fs.writeFileSync(path.join(process.cwd(), 'email-result.json'), JSON.stringify(errorResult, null, 2));
    
    return false;
  }
}

// Execute the function
sendTestEmail()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });