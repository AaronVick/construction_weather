// scripts/send-notifications.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');

// Setup logging
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'email-logs.json');
const logs = [];

function logMessage(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  logs.push(logEntry);
}

// Initialize Firebase
try {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  };

  initializeApp({
    credential: cert(serviceAccount)
  });

  logMessage('Firebase initialized successfully');
} catch (error) {
  logMessage(`Failed to initialize Firebase: ${error.message}`, 'error');
  process.exit(1);
}

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  logMessage('SENDGRID_API_KEY is not set', 'error');
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
logMessage('SendGrid initialized');

// Check for test mode - these will be undefined/falsy if not running in test mode
const isTestMode = process.env.TEST_EMAIL === 'true';
const testRecipient = process.env.TEST_RECIPIENT;

// Log current mode
if (isTestMode) {
  if (!testRecipient) {
    logMessage('Test mode enabled but no test recipient provided - defaulting to normal operation', 'warn');
  } else {
    logMessage(`Running in test mode with recipient: ${testRecipient}`);
  }
} else {
  logMessage('Running in normal operation mode');
}

// Get Firestore instance
const db = getFirestore();

async function main() {
  try {
    // Only run test mode if both flags are properly set
    if (isTestMode && testRecipient) {
      // Send test email
      await sendTestEmail(testRecipient);
      logMessage('Test email process completed');
    } else {
      // Normal operation - process pending alerts
      const alertsSnapshot = await db.collection('weather_alerts').where('notified', '==', false).get();
      logMessage(`Found ${alertsSnapshot.size} pending weather alerts`);
      
      if (alertsSnapshot.empty) {
        logMessage('No pending alerts to process');
      } else {
        // Process each alert
        for (const alertDoc of alertsSnapshot.docs) {
          const alertData = alertDoc.data();
          await processAlert(alertDoc.id, alertData);
        }
        logMessage('All alerts processed successfully');
      }
    }
  } catch (error) {
    logMessage(`Error in main process: ${error.message}`, 'error');
  } finally {
    // Save logs to file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  }
}

async function processAlert(alertId, alertData) {
  try {
    logMessage(`Processing alert ${alertId} for site: ${alertData.siteId}`);
    
    // Get site information
    const siteDoc = await db.collection('sites').doc(alertData.siteId).get();
    if (!siteDoc.exists) {
      logMessage(`Site ${alertData.siteId} not found`, 'error');
      return;
    }
    
    const siteData = siteDoc.data();
    
    // Get users to notify
    const usersSnapshot = await db.collection('user_profiles')
      .where('siteSubscriptions', 'array-contains', alertData.siteId)
      .get();
    
    logMessage(`Found ${usersSnapshot.size} users to notify for site ${alertData.siteId}`);
    
    // Send emails to each user
    const emailPromises = [];
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.email && userData.preferences?.emailNotifications !== false) {
        emailPromises.push(sendAlertEmail(userData.email, alertData, siteData));
      }
    }
    
    await Promise.all(emailPromises);
    
    // Mark alert as notified
    await db.collection('weather_alerts').doc(alertId).update({
      notified: true,
      notifiedAt: new Date().toISOString()
    });
    
    logMessage(`Alert ${alertId} processed successfully`);
  } catch (error) {
    logMessage(`Error processing alert ${alertId}: ${error.message}`, 'error');
  }
}

async function sendAlertEmail(email, alertData, siteData) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts';
    
    // Create email content
    const subject = `Weather Alert for ${siteData.name}: ${alertData.alertType}`;
    
    const text = `
Weather Alert for ${siteData.name}

Alert Type: ${alertData.alertType}
Site: ${siteData.name}
Location: ${siteData.location.city}, ${siteData.location.state}
Time: ${new Date(alertData.timestamp).toLocaleString()}

Details:
${alertData.description}

View more details on your Construction Weather dashboard.
    `;
    
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #d9534f;">Weather Alert for ${siteData.name}</h1>
  
  <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
    <p><strong>Alert Type:</strong> ${alertData.alertType}</p>
    <p><strong>Site:</strong> ${siteData.name}</p>
    <p><strong>Location:</strong> ${siteData.location.city}, ${siteData.location.state}</p>
    <p><strong>Time:</strong> ${new Date(alertData.timestamp).toLocaleString()}</p>
  </div>
  
  <div style="margin-top: 20px;">
    <h2>Details:</h2>
    <p>${alertData.description}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center;">
    <a href="https://your-app-url.com/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Dashboard</a>
  </div>
</div>
    `;
    
    // Send email
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      text,
      html
    };
    
    const response = await sgMail.send(msg);
    logMessage(`Email sent to ${email}: Status ${response[0].statusCode}`);
    
    return response;
  } catch (error) {
    logMessage(`Error sending email to ${email}: ${error.message}`, 'error');
    throw error;
  }
}

async function sendTestEmail(email) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts';
    
    // Create test email content
    const subject = 'Test Email from Construction Weather Notifications';
    
    const text = `
This is a test email from the Construction Weather notification system.

If you're receiving this email, it means that the SendGrid email service is properly configured and working.

This email was sent as part of a GitHub Actions workflow test.
    `;
    
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #28a745;">Test Email</h1>
  
  <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
    <p>This is a test email from the Construction Weather notification system.</p>
    <p>If you're receiving this email, it means that the SendGrid email service is properly configured and working.</p>
  </div>
  
  <div style="margin-top: 20px;">
    <p>This email was sent as part of a GitHub Actions workflow test.</p>
  </div>
</div>
    `;
    
    // Send email
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject,
      text,
      html
    };
    
    const response = await sgMail.send(msg);
    logMessage(`Test email sent to ${email}: Status ${response[0].statusCode}`);
    
    return response;
  } catch (error) {
    logMessage(`Error sending test email to ${email}: ${error.message}`, 'error');
    throw error;
  }
}

// Run the main function
main().catch(error => {
  logMessage(`Unhandled error in main process: ${error.message}`, 'error');
  process.exit(1);
});