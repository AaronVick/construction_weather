# Migrating from Supabase to Firebase

This document outlines the steps to migrate the Construction Weather application from Supabase to Firebase.

## Prerequisites

1. Firebase project set up with Firestore, Authentication, and Storage enabled
2. Firebase service account key (serviceAccountKey.json)
3. Firebase environment variables configured in Vercel

## Migration Steps

### 1. Install Firebase Dependencies

```bash
npm install firebase firebase-admin
```

### 2. Configure Firebase Environment Variables

Ensure the following environment variables are set in your Vercel project:

**Frontend Variables (already set in .env.local):**
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_FIREBASE_MEASUREMENT_ID

**Backend Variables (set in Vercel):**
- FIREBASE_TYPE
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL
- FIREBASE_CLIENT_ID
- FIREBASE_AUTH_URI
- FIREBASE_TOKEN_URI
- FIREBASE_AUTH_PROVIDER_X509_CERT_URL
- FIREBASE_CLIENT_X509_CERT_URL
- FIREBASE_UNIVERSE_DOMAIN

### 3. Migrate Data from Supabase to Firebase

Run the migration script to transfer data from Supabase to Firebase:

```bash
node scripts/migrate-to-firebase.js
```

This script will migrate:
- Users
- Clients
- Jobsites
- Workers
- Worker-Jobsite relationships
- Subscriptions

### 4. Update Application Code

The following files have been created or updated to use Firebase instead of Supabase:

**Frontend:**
- `src/lib/firebaseClient.ts` - Firebase client configuration
- `src/contexts/FirebaseContext.tsx` - Firebase authentication context
- `src/hooks/useFirebaseAuth.ts` - Hook for Firebase authentication
- `src/services/firebaseClientService.ts` - Client data service using Firebase
- `src/services/firebaseJobsiteService.ts` - Jobsite data service using Firebase
- `src/services/firebaseWeatherService.ts` - Weather service using Firebase

**Backend:**
- `api/lib/firebaseAdmin.ts` - Firebase Admin configuration
- `api/import-clients-firebase.ts` - API endpoint for importing clients
- `api/weather-gpt-firebase.ts` - API endpoint for weather descriptions

### 5. Update Application Entry Point

Update `src/main.tsx` to use the Firebase context provider instead of the Supabase provider.

### 6. Update API Routes

Rename the Firebase API files to replace the existing Supabase API files:
- Rename `api/import-clients-firebase.ts` to `api/import-clients.ts`
- Rename `api/weather-gpt-firebase.ts` to `api/weather-gpt.ts`

### 7. Testing

Test the application thoroughly to ensure all functionality works with Firebase:
- User authentication (sign up, sign in, sign out)
- Client management (create, read, update, delete)
- Jobsite management
- Weather monitoring
- Notifications

### 8. Deployment

Deploy the updated application to Vercel:

```bash
vercel --prod
```

## Rollback Plan

If issues are encountered during migration:

1. Revert code changes to use Supabase
2. Redeploy the application

## Post-Migration Tasks

1. Monitor application performance and error logs
2. Update Firebase security rules for Firestore and Storage
3. Set up Firebase backups
4. Consider implementing Firebase Functions for serverless operations

## Firebase vs Supabase Differences

- **Authentication:** Firebase Auth uses a different authentication flow than Supabase Auth
- **Database:** Firestore is a NoSQL document database, while Supabase uses PostgreSQL
- **Queries:** Firestore queries have different limitations and capabilities compared to SQL queries
- **Real-time:** Both platforms support real-time updates but implement them differently
