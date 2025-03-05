// src/lib/firebaseClient.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Add debug logging
console.log('Firebase Config:', {
  apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: !!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: !!import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: !!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});

// Check if Firebase environment variables are set
if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
  throw new Error('Missing Firebase environment variables. Check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

// Helper to handle common Firebase error patterns
export const handleFirebaseError = (error: any) => {
  console.error('Firebase error:', error);
  
  // For authentication errors
  if (error?.code?.includes('auth/')) {
    const errorCode = error.code.replace('auth/', '');
    
    if (errorCode.includes('email') || errorCode.includes('user')) {
      return {
        message: error.message || 'Authentication error with email',
        field: 'email',
      };
    }
    
    if (errorCode.includes('password')) {
      return {
        message: error.message || 'Authentication error with password',
        field: 'password',
      };
    }
    
    return {
      message: error.message || 'Authentication error',
      field: null,
    };
  }
  
  // For Firestore errors
  if (error?.code?.includes('firestore/')) {
    // Handle specific Firestore errors
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
