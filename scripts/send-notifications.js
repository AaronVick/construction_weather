// scripts/send-notifications.js
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const sgMail = require('@sendgrid/mail');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(SENDGRID_API_KEY);

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Test mode
const TEST_MODE = process.env.TEST_EMAIL === 'true';
const TEST_RECIPIENT = process.env.TEST_RECIPIENT;

/**
 * Main function to send weather notifications
 */
async function sendWeatherNotifications() {
  try {
    console.log('Starting notification process...');
    
    let jobsitesToNotify = [];
    
    if (TEST_MODE) {
      console.log('Running in TEST MODE');
      // Create test notification data
      jobsitesToNotify = await createTestNotificationData();
    } else {
      // Get results from latest weather check
      jobsitesToNotify = await getLatestWeatherCheckResults();
    }
    
    if (jobsitesToNotify.length === 0) {
      console.log('No notifications to send.');
      return { sent: 0, failed: 0 };
    }
    
    console.log(`Preparing to send notifications for ${jobsitesToNotify.length} jobsites`);
    
    // Process each jobsite notification
    const results = [];
    for (const jobsite of jobsitesToNotify) {
      try {
        const notificationResult = await processJobsiteNotification(jobsite);
        results.push(notificationResult);
      } catch (err) {
        console.error(`Error processing notification for jobsite ${jobsite.jobsiteId}:`, err);
        results.push({
          jobsiteId: jobsite.jobsiteId,
          jobsiteName: jobsite.jobsiteName,
          success: false,
          error: err.message
        });
      }
    }
    
    // Save results and log statistics
    await saveResults(results);
    
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      clientsNotified: results.reduce((acc, r) => acc + (r.clientsNotified || 0), 0),
      workersNotified: results.reduce((acc, r) => acc + (r.workersNotified || 0), 0),
      emailsSent: results.reduce((acc, r) => acc + (r.emailsSent || 0), 0)
    };
    
    console.log('Notification process completed.');
    console.log('Summary:', summary);
    
    return summary;
  } catch (err) {
    console.error('Error in notification process:', err);
    throw err;
  }
}

/**
 * Get latest weather check results
 */
async function getLatestWeatherCheckResults() {
  try {
    const latestCheckPath = path.join(__dirname, '../logs/latest-weather-check.json');
    const fileContent = await fs.readFile(latestCheckPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Only return results that have notifications triggered
    return data.results.filter(r => r.shouldSendNotification);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No latest weather check results found.');
      return [];
    }
    
    console.error('Error reading latest weather check results:', err);
    throw new Error(`Failed to read latest weather check results: ${err.message}`);
  }
}

/**
 * Create test notification data
 */
async function createTestNotificationData() {
  if (!TEST_RECIPIENT) {
    throw new Error('TEST_RECIPIENT environment variable must be set when running in test mode');
  }
  
  return [{
    jobsiteId: 'test-jobsite-id',
    jobsiteName: 'Test Jobsite',
    zipCode: '10001',
    clientId: 'test-client-id',
    clientName: 'Test Client',
    triggeredConditions: ['rain', 'wind'],
    shouldSendNotification: true,
    weatherDescription: 'Heavy rain and strong winds are expected today with gusts reaching 30mph. These conditions could create hazardous working environments with reduced visibility and potential for flying debris.',
    success: true,
    testRecipient: TEST_RECIPIENT
  }];
}

/**
 * Process notification for a single jobsite
 */
async function processJobsiteNotification(jobsite) {
  console.log(`Processing notification for ${jobsite.jobsiteName}`);
  
  try {
    let clientsNotified = 0;
    let workersNotified = 0;
    let emailsSent = 0;
    let emailLogs = [];
    
    if (TEST_MODE) {
      // Just send a test email
      const emailContent = {
        subject: `[TEST] Weather Alert: Work Canceled at ${jobsite.jobsiteName}`,
        body: `
          This is a TEST notification from WeatherCrew.
          
          ${jobsite.weatherDescription}
          
          If this were a real notification, work would be canceled due to: ${jobsite.triggeredConditions.join(', ')}
          
          ---
          This is only a test. No action is required.
        `
      };
      
      await sendEmail(
        {
          senderName: 'WeatherCrew Notifications (TEST)',
          senderEmail: 'notifications@example.com'
        },
        jobsite.testRecipient,
        'Test Recipient',
        emailContent.subject,
        emailContent.body,
        'test',
        jobsite.triggeredConditions.join(','),
        'test-recipient-id',
        jobsite.jobsiteId
      );
      
      clientsNotified = 1;
      emailsSent = 1;
    } else {
      // For real notifications, we'll use the Supabase service
      const notificationResult = await sendWeatherNotificationsForJobsite(
        jobsite.jobsiteId,
        jobsite.triggeredConditions,
        jobsite.weatherDescription
      );
      
      clientsNotified = notificationResult.clientsNotified;
      workersNotified = notificationResult.workersNotified;
      emailLogs = notificationResult.logs;
      emailsSent = clientsNotified + workersNotified;
    }
    
    return {
      jobsiteId: jobsite.jobsiteId,
      jobsiteName: jobsite.jobsiteName,
      clientsNotified,
      workersNotified,
      emailsSent,
      emailLogs,
      success: true
    };
  } catch (err) {
    console.error(`Failed to process notification for jobsite ${jobsite.jobsiteId}:`, err);
    throw err;
  }
}

/**
 * Send weather notifications for a jobsite using the existing service
 */
async function sendWeatherNotificationsForJobsite(jobsiteId, conditions, weatherDescription) {
  // This will use the service implementation directly in a real production app
  // For now we'll just simulate using the Supabase client directly
  console.log(`Sending notifications for jobsite ${jobsiteId}`);
  
  try {
    // Get jobsite data with client and workers
    const { data: jobsite, error: jobsiteError } = await supabase
      .from('jobsites')
      .select(`
        *,
        clients:client_id (id, name, email, is_active),
        worker_jobsites:worker_jobsites (
          workers:worker_id (id, name, email, is_active)
        )
      `)
      .eq('id', jobsiteId)
      .single();
      
    if (jobsiteError) throw jobsiteError;
    
    // Check if notification settings are enabled
    const notificationSettings = jobsite.weather_monitoring.notification_settings;
    if (!notificationSettings.notify_client && !notificationSettings.notify_workers) {
      return { clientsNotified: 0, workersNotified: 0, logs: [] };
    }
    
    // Get email configuration
    const { data: config, error: configError } = await supabase
      .from('system_settings')
      .select('email_config')
      .single();
      
    if (configError) throw configError;
    
    const emailConfig = config.email_config;
    
    // Generate email content
    const emailContent = await generateEmailContent(
      jobsite.name,
      conditions,
      weatherDescription,
      emailConfig
    );
    
    const logs = [];
    let clientsNotified = 0;
    let workersNotified = 0;
    
    // Send to client if active and notification enabled
    if (
      notificationSettings.notify_client &&
      jobsite.clients.is_active
    ) {
      try {
        await sendEmail(
          emailConfig,
          jobsite.clients.email,
          jobsite.clients.name,
          emailContent.subject,
          emailContent.body,
          'client',
          conditions.join(','),
          jobsite.clients.id,
          jobsite.id
        );
        
        // Log email to Supabase
        const { data: logEntry, error: logError } = await supabase
          .from('email_logs')
          .insert({
            client_id: jobsite.clients.id,
            subject: emailContent.subject,
            body: emailContent.body,
            recipient_email: jobsite.clients.email,
            recipient_name: jobsite.clients.name,
            status: 'sent',
            trigger: 'weather',
            weather_condition: conditions.join(', '),
            jobsite_id: jobsite.id,
            sent_at: new Date().toISOString(),
          })
          .select()
          .single();
          
        if (logError) throw logError;
        
        logs.push(logEntry);
        clientsNotified++;
      } catch (error) {
        console.error('Error sending client notification:', error);
        
        // Add failed log
        const { data: failedLog } = await supabase
          .from('email_logs')
          .insert({
            client_id: jobsite.clients.id,
            subject: emailContent.subject,
            body: emailContent.body,
            recipient_email: jobsite.clients.email,
            recipient_name: jobsite.clients.name,
            status: 'failed',
            trigger: 'weather',
            weather_condition: conditions.join(', '),
            jobsite_id: jobsite.id,
            sent_at: new Date().toISOString(),
            error_message: error.message,
          })
          .select()
          .single();
          
        logs.push(failedLog?.data || {
          id: `failed-client-${Date.now()}`,
          client_id: jobsite.clients.id,
          status: 'failed',
          error_message: error.message
        });
      }
    }
    
    // Send to workers if active and notification enabled
    if (notificationSettings.notify_workers) {
      const activeWorkers = jobsite.worker_jobsites
        .map(assignment => assignment.workers)
        .filter(worker => worker.is_active);
        
      for (const worker of activeWorkers) {
        try {
          await sendEmail(
            emailConfig,
            worker.email,
            worker.name,
            emailContent.subject,
            emailContent.body,
            'worker',
            conditions.join(','),
            worker.id,
            jobsite.id
          );
          
          // Log email to Supabase
          const { data: logEntry, error: logError } = await supabase
            .from('email_logs')
            .insert({
              worker_id: worker.id,
              subject: emailContent.subject,
              body: emailContent.body,
              recipient_email: worker.email,
              recipient_name: worker.name,
              status: 'sent',
              trigger: 'weather',
              weather_condition: conditions.join(', '),
              jobsite_id: jobsite.id,
              sent_at: new Date().toISOString(),
            })
            .select()
            .single();
            
          if (logError) throw logError;
          
          logs.push(logEntry);
          workersNotified++;
        } catch (error) {
          console.error('Error sending worker notification:', error);
          
          // Add failed log
          const { data: failedLog } = await supabase
            .from('email_logs')
            .insert({
              worker_id: worker.id,
              subject: emailContent.subject,
              body: emailContent.body,
              recipient_email: worker.email,
              recipient_name: worker.name,
              status: 'failed',
              trigger: 'weather',
              weather_condition: conditions.join(', '),
              jobsite_id: jobsite.id,
              sent_at: new Date().toISOString(),
              error_message: error.message,
            })
            .select()
            .single();
            
          logs.push(failedLog?.data || {
            id: `failed-worker-${Date.now()}-${worker.id}`,
            worker_id: worker.id,
            status: 'failed',
            error_message: error.message
          });
        }
      }
    }
    
    return {
      clientsNotified,
      workersNotified,
      logs,
    };
  } catch (error) {
    console.error('Error sending weather notifications:', error);
    throw new Error(`Failed to send weather notifications: ${error.message}`);
  }
}

/**
 * Generate email content for weather notification
 */
async function generateEmailContent(
  jobsiteName,
  conditions,
  weatherDescription,
  emailConfig
) {
  try {
    const conditionsText = conditions.join(', ');
    const date = new Date().toLocaleDateString();
    
    const prompt = `
      Create a professional email notifying recipients that outdoor work at the ${jobsiteName} jobsite 
      has been canceled due to ${conditionsText} weather conditions on ${date}.
      
      Weather description:
      ${weatherDescription}
      
      The email should:
      1. Have a clear subject line
      2. Briefly explain why work is canceled
      3. Include the weather description
      4. Mention that recipients will be notified when work resumes
      5. Use a ${emailConfig.tone} tone
      6. Be concise and professional
      7. Sign off as ${emailConfig.sender_name}
      
      ${emailConfig.additional_instructions || ''}
      
      Respond in JSON format with 'subject' and 'body' keys.
    `;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing clear, professional workplace communications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const emailContent = JSON.parse(response.data.choices[0].message.content);
    return {
      subject: emailContent.subject,
      body: emailContent.body,
    };
  } catch (error) {
    console.error('Error generating weather notification email:', error);
    
    // Fallback if API call fails
    const subject = `Weather Alert: Work Canceled at ${jobsiteName} for ${new Date().toLocaleDateString()}`;
    const body = `
      Due to ${conditions.join(', ')} conditions, all work at ${jobsiteName} has been canceled for today.
      
      ${weatherDescription}
      
      You will be notified when work resumes. Please contact your supervisor if you have any questions.
      
      Stay safe,
      ${emailConfig.sender_name || 'WeatherCrew Notifications'}
    `;
    
    return { subject, body };
  }
}

/**
 * Send an email using SendGrid
 */
async function sendEmail(
  emailConfig,
  recipientEmail,
  recipientName,
  subject,
  body,
  recipientType,
  weatherCondition,
  recipientId,
  jobsiteId
) {
  try {
    // Prepare email data
    const msg = {
      to: recipientEmail,
      from: {
        email: emailConfig.senderEmail || 'notifications@weathercrew.example.com',
        name: emailConfig.senderName || 'WeatherCrew Notifications'
      },
      subject: subject,
      text: body.replace(/<[^>]*>?/gm, ''), // Strip any HTML for text version
      html: body.replace(/\n/g, '<br>') // Simple HTML conversion
    };
    
    // Use SendGrid to send the email
    if (process.env.NODE_ENV !== 'test' && !TEST_MODE) {
      await sgMail.send(msg);
    } else {
      // Just log in test mode
      console.log(`TEST MODE: Would send email to ${recipientEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body.substr(0, 100)}...`);
    }
    
    console.log(`Email sent to ${recipientName} (${recipientEmail})`);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Get email configuration from system settings
 */
async function getEmailConfig() {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('email_config')
      .limit(1);
      
    if (error) throw error;
    
    // If no settings found, return default values
    if (!data || data.length === 0) {
      return {
        senderName: 'WeatherCrew Notifications',
        senderEmail: 'notifications@example.com',
        tone: 'professional',
        includeWeatherDetails: true,
        subjectTemplate: 'Weather Alert: {weather_condition} for {date}',
        bodyTemplate: 'Due to forecasted {weather_condition}, all site work has been canceled for {date}. {weather_details}',
        temperature: 0.7,
        maxTokens: 200,
        additionalInstructions: 'Be concise and clear.',
        use_ai_enhancement: true
      };
    }
    
    return data[0].email_config;
  } catch (error) {
    console.error('Error fetching email configuration:', error);
    
    // Return default config if error
    return {
      senderName: 'WeatherCrew Notifications',
      senderEmail: 'notifications@example.com',
      tone: 'professional',
      includeWeatherDetails: true,
      subjectTemplate: 'Weather Alert: {weather_condition} for {date}',
      bodyTemplate: 'Due to forecasted {weather_condition}, all site work has been canceled. {weather_details}',
      temperature: 0.7,
      maxTokens: 200,
      additionalInstructions: 'Be concise and clear.',
      use_ai_enhancement: true
    };
  }
}

/**
 * Save results to log file
 */
async function saveResults(results) {
  try {
    const logsDir = path.join(__dirname, '../logs');
    
    // Create logs directory if it doesn't exist
    try {
      await fs.mkdir(logsDir, { recursive: true });
    } catch (err) {
      // Ignore directory exists error
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(logsDir, `email-logs-${timestamp}.json`);
    
    await fs.writeFile(
      logPath,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          clientsNotified: results.reduce((acc, r) => acc + (r.clientsNotified || 0), 0),
          workersNotified: results.reduce((acc, r) => acc + (r.workersNotified || 0), 0),
          emailsSent: results.reduce((acc, r) => acc + (r.emailsSent || 0), 0)
        }
      }, null, 2)
    );
    
    console.log(`Results saved to ${logPath}`);
    
    // Also save to a consistent filename for easier access
    await fs.writeFile(
      path.join(logsDir, 'email-logs.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results
      }, null, 2)
    );
  } catch (err) {
    console.error('Error saving results:', err);
  }
}

// Run main function
sendWeatherNotifications()
  .then((summary) => {
    console.log('Weather notification process completed successfully');
    console.log('Summary:', summary);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error in weather notification process:', err);
    process.exit(1);
  });