// api/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Define proper types for our response data
interface SendgridStatus {
  status: 'ok' | 'error';
  message: string;
  lastChecked: string;
  fromEmail?: string;
  fromName?: string;
}

interface FirebaseStatus {
  status: 'ok' | 'error';
  message: string;
  lastChecked: string;
}

interface ApiStatusResponse {
  timestamp: string;
  firebase: FirebaseStatus;
  sendgrid: SendgridStatus;
}

// Safe Firebase Admin initialization
let firebaseAdmin: typeof admin;
let db: FirebaseFirestore.Firestore;
let auth: admin.auth.Auth;

try {
  // Check if Firebase is already initialized using a safer approach
  if (!admin.apps || admin.apps.length === 0) {
    console.log('Initializing Firebase Admin in API status endpoint');
    
    // Log environment variables for debugging (without exposing values)
    console.log('Firebase environment check:');
    console.log('FIREBASE_PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
    console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
    
    // Initialize Firebase Admin with service account credentials
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_PROJECT_ID 
        ? `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com` 
        : undefined,
    });
    
    console.log('Firebase Admin initialized successfully');
  } else {
    console.log('Firebase Admin already initialized');
  }
  
  // Get Firebase services
  firebaseAdmin = admin;
  db = admin.firestore();
  auth = admin.auth();
} catch (initError) {
  console.error('Firebase Admin initialization error:', initError);
  // Continue execution even if Firebase fails to initialize
  // We'll handle this in the request handler
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Direct API status endpoint called');
  
  // Only allow GET method
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if Firebase initialized successfully
    if (!db || !auth) {
      console.error('Firebase services not available');
      return res.status(500).json({
        error: 'Firebase services not initialized',
        message: 'There was an error initializing Firebase. Check server logs for details.'
      });
    }
    
    // Log SendGrid environment variables (without exposing values)
    console.log('SendGrid environment check:');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_API exists:', !!process.env.SENDGRID_API);
    console.log('SENDGRID_FROM_EMAIL exists:', !!process.env.SENDGRID_FROM_EMAIL);
    console.log('SENDGRID_FROM_NAME exists:', !!process.env.SENDGRID_FROM_NAME);
    
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');
    
    // Verify the token and get the user info in a try/catch block
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Token verified for user:', userId);
      
      // Check if the user exists in a separate try/catch
      try {
        const userRecord = await auth.getUser(userId);
        console.log('User record found:', userRecord.email);
        
        // Check if the user is an admin in a separate try/catch
        try {
          const userRef = db.collection('user_profiles').doc(userId);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            console.log('User profile not found');
            return res.status(403).json({ error: 'Permission denied. User profile not found.' });
          }
          
          const userData = userDoc.data();
          const isAdmin = userData?.role === 'admin';
          console.log('User admin status:', isAdmin);
          
          if (!isAdmin) {
            console.log('User is not an admin');
            return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
          }
          
          // Check SendGrid status - simple environment variable check only
          const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API;
          console.log('SendGrid API key configuration status:', apiKey ? 'Configured' : 'Not configured');
          
          // Create response with proper typing
          const response: ApiStatusResponse = {
            timestamp: new Date().toISOString(),
            firebase: {
              status: 'ok',
              message: 'Firebase is connected',
              lastChecked: new Date().toISOString()
            },
            sendgrid: {
              status: apiKey ? 'ok' : 'error',
              message: apiKey 
                ? 'SendGrid API key is configured' 
                : 'SendGrid API key not found in environment variables',
              lastChecked: new Date().toISOString()
            }
          };
          
          // Now TypeScript knows these properties are allowed
          if (process.env.SENDGRID_FROM_EMAIL) {
            response.sendgrid.fromEmail = process.env.SENDGRID_FROM_EMAIL;
          }
          
          if (process.env.SENDGRID_FROM_NAME) {
            response.sendgrid.fromName = process.env.SENDGRID_FROM_NAME;
          }
          
          return res.status(200).json(response);
          
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);
          return res.status(500).json({ 
            error: 'Failed to check user permissions',
            message: profileError instanceof Error ? profileError.message : 'Unknown profile error'
          });
        }
      } catch (userError) {
        console.error('Error getting user record:', userError);
        return res.status(401).json({ 
          error: 'User not found',
          message: userError instanceof Error ? userError.message : 'Unknown user error'
        });
      }
    } catch (tokenError) {
      console.error('Error verifying token:', tokenError);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        message: tokenError instanceof Error ? tokenError.message : 'Unknown token error'
      });
    }
  } catch (error) {
    console.error('Unhandled error in direct API status endpoint:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown server error',
      timestamp: new Date().toISOString()
    });
  }
}