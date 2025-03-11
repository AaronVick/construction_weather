// api/consolidated/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../../src/lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Consolidated API status endpoint called');
  
  // Only allow GET method
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log environment variables for debugging (without exposing values)
    console.log('Environment variables check:');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_API exists:', !!process.env.SENDGRID_API);
    console.log('SENDGRID_FROM_EMAIL exists:', !!process.env.SENDGRID_FROM_EMAIL);
    console.log('SENDGRID_FROM_NAME exists:', !!process.env.SENDGRID_FROM_NAME);
    
    // Verify authentication
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Missing or invalid authorization header');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const token = authHeader.split('Bearer ')[1];
      console.log('Token received, verifying...');
      
      // Verify the token and get the user
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Token verified for user:', userId);
      
      // Check if the user exists
      const userRecord = await auth.getUser(userId);
      console.log('User record found:', userRecord.email);
      
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
      
      // Check SendGrid API key configuration
      const apiKey = process.env.SENDGRID_API_KEY || process.env.SENDGRID_API;
      
      // Prepare response with basic info, avoiding any dynamic imports or external calls
      const response = {
        timestamp: new Date().toISOString(),
        sendgrid: {
          status: apiKey ? 'ok' : 'error',
          message: apiKey 
            ? 'SendGrid API key is configured' 
            : 'SendGrid API key not found in environment variables',
          lastChecked: new Date().toISOString()
        }
      };
      
      // Add optional from email/name if available
      if (process.env.SENDGRID_FROM_EMAIL) {
        response.sendgrid.fromEmail = process.env.SENDGRID_FROM_EMAIL;
      }
      
      if (process.env.SENDGRID_FROM_NAME) {
        response.sendgrid.fromName = process.env.SENDGRID_FROM_NAME;
      }
      
      // Return successful response
      console.log('API status check completed successfully');
      return res.status(200).json(response);
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({
        error: 'Authentication failed',
        message: authError instanceof Error ? authError.message : 'Unknown authentication error'
      });
    }
  } catch (error) {
    // Log the full error for debugging
    console.error('Critical error in API status endpoint:', error);
    
    // Send a simplified error response
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}