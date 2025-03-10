# SendGrid Setup Guide for Construction Weather

This guide explains how to set up SendGrid for email notifications in the Construction Weather application.

## Prerequisites

- A SendGrid account (you can sign up at [SendGrid](https://sendgrid.com/))
- Admin access to the Construction Weather application

## Step 1: Create a SendGrid Account

1. Go to [SendGrid's website](https://sendgrid.com/) and sign up for an account
2. Complete the verification process

## Step 2: Create an API Key

1. Log in to your SendGrid account
2. Navigate to Settings > API Keys
3. Click "Create API Key"
4. Name your key (e.g., "Construction Weather API Key")
5. Select "Full Access" or customize permissions (at minimum, you need "Mail Send" permissions)
6. Click "Create & View"
7. Copy the API key that is displayed (you won't be able to see it again)

## Step 3: Set Up Sender Authentication

SendGrid requires sender authentication to prevent spam:

1. In SendGrid, go to Settings > Sender Authentication
2. Choose either Domain Authentication or Single Sender Verification
   - Domain Authentication is recommended for production environments
   - Single Sender Verification is simpler but has limitations

### For Domain Authentication:

1. Click "Authenticate a Domain"
2. Enter your domain name
3. Follow the DNS configuration instructions
4. Verify the domain

### For Single Sender Verification:

1. Click "Verify a Single Sender"
2. Enter the email address you want to send from
3. Complete the verification process by clicking the link in the email sent to that address

## Step 4: Configure Environment Variables

Add the following environment variables to your deployment:

```
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@example.com
SENDGRID_FROM_NAME=Construction Weather Alerts
```

For local development, add these to your `.env.local` file.

For production deployment on Vercel, add these in the Vercel project settings under Environment Variables.

## Step 5: Test the Integration

1. In the Construction Weather admin dashboard, go to "Email Testing"
2. Enter a test recipient email address
3. Click "Send Test Email"
4. Verify that the email is received

## Troubleshooting

If you encounter issues with SendGrid integration:

1. Check that your API key is correct and has the necessary permissions
2. Verify that your sender email is authenticated
3. Check the SendGrid Activity Feed for any delivery issues
4. Ensure all required environment variables are set correctly
5. Check the application logs for any error messages

## Additional Resources

- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
