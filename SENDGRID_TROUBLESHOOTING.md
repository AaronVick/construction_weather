# SendGrid API Troubleshooting Guide

This guide helps diagnose and fix issues with the SendGrid API integration in the Construction Weather application.

## Symptoms

- 500 Internal Server Error when accessing `/api/admin/api-status`
- Error messages in the console related to SendGrid
- Email testing features not working properly
- "SendGrid Error" displayed in the admin dashboard

## Root Cause

The application is unable to connect to the SendGrid API due to missing or incorrect environment variables. The SendGrid API key and related configuration are not properly set up in the deployment environment.

## Solution

### Step 1: Set Up SendGrid Environment Variables

1. Add the required SendGrid environment variables to your deployment:

   ```
   SENDGRID_API_KEY=your_api_key_here
   SENDGRID_FROM_EMAIL=your_verified_email@example.com
   SENDGRID_FROM_NAME=Construction Weather Alerts
   ```

   For local development, these should be in your `.env.local` file.
   For production, add these in your Vercel project settings.

2. Make sure the `SENDGRID_API_KEY` is valid and has the necessary permissions.
3. Ensure the `SENDGRID_FROM_EMAIL` is authenticated in your SendGrid account.

### Step 2: Verify SendGrid Configuration

Use the provided test script to verify your SendGrid configuration:

```bash
# Install dependencies if needed
npm install --save @sendgrid/mail dotenv

# Run the test script
node scripts/test-sendgrid.js your-test-email@example.com
```

This script will attempt to send a test email using your SendGrid configuration and provide detailed error information if it fails.

### Step 3: Check SendGrid Account Status

1. Log in to your SendGrid account
2. Check if your account is active and in good standing
3. Verify that your sender authentication is properly set up
4. Check the Activity Feed for any failed email attempts

### Step 4: Restart Your Application

After updating the environment variables, restart your application:

```bash
# For local development
npm run dev

# For Vercel deployments
# Trigger a new deployment from the Vercel dashboard
```

### Step 5: Test the Integration

1. Go to the Admin Dashboard
2. Navigate to Email Testing
3. Send a test email
4. Check the console for any error messages

## Advanced Troubleshooting

### Debugging API Endpoints

If you're still experiencing issues, you can add additional logging to the API endpoints:

1. Open `api/admin/api-status.ts`
2. Add more detailed logging in the SendGrid status check section
3. Redeploy the application

### Checking Network Requests

Use your browser's developer tools to inspect the network requests:

1. Open the browser developer tools (F12 or Ctrl+Shift+I)
2. Go to the Network tab
3. Navigate to the Email Testing page
4. Look for requests to `/api/admin/api-status` or `/api/admin/test-email`
5. Check the response status and body for error details

### Verifying Environment Variables

To verify that your environment variables are correctly loaded:

1. Add a temporary logging statement to `api/admin/api-status.ts`:
   ```typescript
   console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY);
   ```
2. Check the server logs for this message

## Need More Help?

If you're still experiencing issues after following these steps, please:

1. Check the [SendGrid documentation](https://docs.sendgrid.com/)
2. Review the [SendGrid Node.js library documentation](https://github.com/sendgrid/sendgrid-nodejs)
3. Contact SendGrid support if you believe the issue is with your SendGrid account
