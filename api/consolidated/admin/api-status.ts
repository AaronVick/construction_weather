// api/consolidated/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../../src/lib/firebaseAdmin';

import sgMail from '@sendgrid/mail';

// Define proper types for our response data
interface SendgridStatus {
  status: 'ok' | 'error';
  message: string;
  lastChecked: string;
  fromEmail?: string;
  fromName?: string;
  details?: string | Record<string, any>;
}

interface ApiStatusResponse {
  timestamp: string;
  sendgrid: SendgridStatus;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Consolidated API status endpoint called');
  
  // Only allow GET method
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Log environment variables (without exposing values)
  console.log('Environment variables check:');
  console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
  console.log('SENDGRID_API exists:', !!process.env.SENDGRID_API);
  console.log('SENDGRID_FROM_EMAIL exists:', !!process.env.SENDGRID_FROM_EMAIL);
  console.log('SENDGRID_FROM_NAME exists:', !!process.env.SENDGRID_FROM_NAME);

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');
    
    try {
      // Verify the token and get the user
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Token verified for user:', userId);
      
      try {
        // Check if the user exists
        const userRecord = await auth.getUser(userId);
        console.log('User record found:', userRecord.email);
        
        try {
          // Check if the user is an admin
          const userRef = db.collection('user_profiles').doc(userId);
          const userDoc = await userRef.get();
          
          if (!userDoc.exists) {
            console.log('User profile not found for ID:', userId);
            return res.status(403).json({ 
              error: 'Permission denied. User profile not found.' 
            });
          }
          
          const userData = userDoc.data();
          const isAdmin = userData?.role === 'admin';
          console.log('User admin status:', isAdmin);
          
          if (!isAdmin) {
            console.log('Permission denied for user:', userId);
            return res.status(403).json({ 
              error: 'Permission denied. Only admins can access this endpoint.' 
            });
          }
          
          // Initialize the response with proper types
          const responseData: ApiStatusResponse = {
            timestamp: new Date().toISOString(),
            sendgrid: {
              status: 'unknown' as 'ok' | 'error',
              message: 'Not checked',
              lastChecked: new Date().toISOString()
            }
          };
          
          // Check SendGrid status - try both possible env vars
          const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API;
          
          console.log('Checking SendGrid configuration...');
          if (!apiKey) {
            console.log('SendGrid API key not configured in either env var');
            responseData.sendgrid = {
              status: 'error',
              message: 'SendGrid API key not configured in environment variables',
              lastChecked: new Date().toISOString()
            };
          } else {
            try {
              // Just validate the API key format (if invalid, this will throw)
              sgMail.setApiKey(apiKey);
              console.log('SendGrid API key format is valid');
              
              // Don't make any actual API calls that could time out
              responseData.sendgrid = {
                status: 'ok',
                message: 'SendGrid API key is configured with valid format',
                lastChecked: new Date().toISOString()
              };
              
              // Include additional info if available
              if (process.env.SENDGRID_FROM_EMAIL) {
                responseData.sendgrid.fromEmail = process.env.SENDGRID_FROM_EMAIL;
              }
              
              if (process.env.SENDGRID_FROM_NAME) {
                responseData.sendgrid.fromName = process.env.SENDGRID_FROM_NAME;
              }
            } catch (sendgridError) {
              console.error('SendGrid API key validation error:', sendgridError);
              responseData.sendgrid = {
                status: 'error',
                message: 'Invalid SendGrid API key format',
                details: sendgridError instanceof Error ? sendgridError.message : 'Unknown error',
                lastChecked: new Date().toISOString()
              };
            }
          }
          
          return res.status(200).json(responseData);
          
        } catch (profileError) {
          console.error('Error checking user profile:', profileError);
          return res.status(500).json({ 
            error: 'Failed to check user permissions',
            details: profileError instanceof Error ? profileError.message : 'Unknown error'
          });
        }
      } catch (userError) {
        console.error('Error fetching user record:', userError);
        return res.status(401).json({ 
          error: 'User not found',
          details: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    } catch (tokenError) {
      console.error('Error verifying token:', tokenError);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error('Unhandled error in API status endpoint:', error);
    return res.status(500).json({
      error: 'Failed to check API status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}