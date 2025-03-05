// api/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  // Initialize Firebase Admin with service account credentials from environment variables
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  });
}

// Export the admin instance
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };

// Helper function to handle Firebase Admin errors
export const handleFirebaseAdminError = (error: any) => {
  console.error('Firebase Admin error:', error);
  
  // For authentication errors
  if (error?.code?.includes('auth/')) {
    return {
      message: error.message || 'Authentication error',
      field: null,
    };
  }
  
  // For Firestore errors
  if (error?.code?.includes('firestore/')) {
    if (error.code === 'firestore/permission-denied') {
      return {
        message: 'You don\'t have permission to perform this action.',
        field: 'permission',
      };
    }
    
    return {
      message: error.message || 'Database error',
      field: null,
    };
  }
  
  // Default error
  return {
    message: error?.message || 'An unknown error occurred',
    field: null,
  };
};
