# Firebase Setup Guide for Construction Weather

This guide explains how to set up Firebase for the Construction Weather application.

## Prerequisites

- A Google account
- Admin access to the Construction Weather application

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "Construction Weather")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

## Step 2: Set Up Firebase Authentication

1. In the Firebase Console, select your project
2. Go to "Authentication" in the left sidebar
3. Click "Get started"
4. Enable the "Email/Password" sign-in method
5. Optionally, enable other sign-in methods as needed
6. Save your changes

## Step 3: Create a Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode" (recommended)
4. Select a location for your database (choose the region closest to your users)
5. Click "Enable"

## Step 4: Set Up Firebase Storage (Optional)

1. In the Firebase Console, go to "Storage"
2. Click "Get started"
3. Review and accept the default security rules
4. Click "Next" and then "Done"

## Step 5: Register Your Web App

1. In the Firebase Console, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" and click the web icon (</>) 
4. Enter a nickname for your app (e.g., "Construction Weather Web")
5. Optionally, set up Firebase Hosting if you plan to use it
6. Click "Register app"
7. Copy the Firebase configuration object that appears

## Step 6: Configure Environment Variables

Add the following environment variables to your local development environment:

```
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

For local development, add these to your `.env.local` file.

For production deployment on Vercel, add these in the Vercel project settings under Environment Variables.

## Step 7: Set Up Firebase Admin SDK (for API Routes)

1. In the Firebase Console, go to "Project settings"
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely
5. Add the following environment variables to your deployment:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important**: The `FIREBASE_PRIVATE_KEY` should include the entire private key, including the begin and end markers, and all newlines should be represented as `\n`.

## Step 8: Set Up Firestore Security Rules

1. In the Firebase Console, go to "Firestore Database"
2. Click the "Rules" tab
3. Update the rules to secure your data. Here's a basic example:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read public data
    match /public/{document=**} {
      allow read: if request.auth != null;
    }
    
    // Admin users can read and write all data
    match /{document=**} {
      allow read, write: if request.auth != null && get(/databases/$(database)/documents/user_profiles/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## Step 9: Test the Integration

1. Start your local development server
2. Try to sign in or sign up
3. Verify that authentication works
4. Check the Firebase Console to see if user data is being stored correctly

## Troubleshooting

If you encounter issues with Firebase integration:

1. Check that all environment variables are set correctly
2. Verify that your Firebase project is properly configured
3. Check the browser console for any error messages
4. Ensure that your Firebase security rules allow the operations you're trying to perform
5. Check the Firebase Authentication panel to see if users are being created correctly

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Web SDK Reference](https://firebase.google.com/docs/reference/js)
- [Firebase Admin SDK Reference](https://firebase.google.com/docs/reference/admin)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
