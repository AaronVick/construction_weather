#!/usr/bin/env node

/**
 * SendGrid API Test Script
 * 
 * This script tests the SendGrid API key by sending a test email.
 * It helps verify that your SendGrid configuration is working correctly.
 * 
 * Usage:
 *   node test-sendgrid.js <recipient-email>
 * 
 * Example:
 *   node test-sendgrid.js test@example.com
 */

// Load environment variables from .env.local if present
require('dotenv').config({ path: '.env.local' });

const sgMail = require('@sendgrid/mail');

// Check if SendGrid API key is set
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  console.error('Error: SENDGRID_API_KEY environment variable is not set.');
  console.error('Please set it in your .env.local file or as an environment variable.');
  process.exit(1);
}

// Set SendGrid API key
sgMail.setApiKey(apiKey);

// Get recipient email from command line arguments
const recipient = process.argv[2];
if (!recipient) {
  console.error('Error: Recipient email is required.');
  console.error('Usage: node test-sendgrid.js <recipient-email>');
  process.exit(1);
}

// Validate email format (simple validation)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(recipient)) {
  console.error('Error: Invalid email format.');
  process.exit(1);
}

// Set from email and name
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@constructionweather.com';
const fromName = process.env.SENDGRID_FROM_NAME || 'Construction Weather Alerts';

// Create email message
const msg = {
  to: recipient,
  from: {
    email: fromEmail,
    name: fromName
  },
  subject: 'SendGrid API Test',
  text: 'This is a test email sent from the Construction Weather application to verify SendGrid API integration.',
  html: '<p>This is a test email sent from the Construction Weather application to verify SendGrid API integration.</p>'
};

// Send the email
console.log(`Sending test email to ${recipient}...`);
sgMail.send(msg)
  .then(response => {
    console.log('SendGrid API test successful!');
    console.log(`Email sent to ${recipient}`);
    console.log('Response:', {
      statusCode: response[0].statusCode,
      headers: response[0].headers
    });
  })
  .catch(error => {
    console.error('Error sending test email:');
    console.error(error.toString());
    
    // If there's a response, log it
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
    
    // Provide troubleshooting tips
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your SENDGRID_API_KEY is correct');
    console.log('2. Verify that your sender email is authenticated in SendGrid');
    console.log('3. Check SendGrid Activity Feed for more details');
    
    process.exit(1);
  });
