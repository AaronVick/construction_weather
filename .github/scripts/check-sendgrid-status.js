const fs = require('fs');
const path = require('path');

function checkSendGridStatus() {
  console.log('Checking SendGrid configuration...');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME;
  
  const status = {
    timestamp: new Date().toISOString(),
    sendgrid: {
      status: apiKey ? 'ok' : 'error',
      message: apiKey 
        ? 'SendGrid API key is configured' 
        : 'SendGrid API key not found in environment variables',
      fromEmail: fromEmail || null,
      fromName: fromName || null,
      config: {
        keyExists: !!apiKey,
        fromEmailExists: !!fromEmail,
        fromNameExists: !!fromName
      }
    }
  };
  
  // Output to GitHub Actions
  console.log(`::set-output name=status::${status.sendgrid.status}`);
  console.log(`::set-output name=message::${status.sendgrid.message}`);
  console.log(`::set-output name=timestamp::${status.timestamp}`);
  
  // Write to file for more detailed output
  fs.writeFileSync('sendgrid-status.json', JSON.stringify(status, null, 2));
  console.log('Status check completed and saved to sendgrid-status.json');
  
  // Output full status to console
  console.log('SendGrid Status:', JSON.stringify(status, null, 2));
  
  return status.sendgrid.status === 'ok';
}

// Run the check
const isConfigured = checkSendGridStatus();
process.exit(isConfigured ? 0 : 1);