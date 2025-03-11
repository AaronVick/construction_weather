// api/consolidated/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;
    
    // Check if the user exists
    const userRecord = await auth.getUser(userId);
    if (!userRecord) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if the user is an admin
    const userRef = db.collection('user_profiles').doc(userId);
    const userDoc = await userRef.get();
    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
    }
    
    // Define response data interface
    interface ApiStatusResponse {
      timestamp: string;
      sendgrid?: {
        status: 'ok' | 'error';
        message: string;
        details?: string;
        lastChecked: string;
      };
      firebase?: {
        status: 'ok' | 'error';
        message: string;
        lastChecked: string;
      };
    }
    
    // Build response with service statuses
    const responseData: ApiStatusResponse = {
      timestamp: new Date().toISOString()
    };
    
    // Check SendGrid status
    if (!process.env.SENDGRID_API_KEY) {
      responseData.sendgrid = {
        status: 'error',
        message: 'SendGrid API key not configured',
        lastChecked: new Date().toISOString()
      };
    } else {
      try {
        // Initialize SendGrid with the API key
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        // Use a lightweight API call to validate the key
        // Type assertion needed because request() is not properly typed in @sendgrid/mail
        await (sgMail as any).request({
          method: 'GET',
          url: '/v3/user/credits'
        });
        
        // If we reach here, the API key is valid
        responseData.sendgrid = {
          status: 'ok',
          message: 'SendGrid API configured properly',
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        console.error('SendGrid API key validation error:', error);
        
        responseData.sendgrid = {
          status: 'error',
          message: 'Invalid SendGrid API key or SendGrid API unreachable',
          details: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString()
        };
      }
    }
    
    // Add Firebase status
    responseData.firebase = {
      status: 'ok',
      message: 'Firebase is connected',
      lastChecked: new Date().toISOString()
    };
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error checking consolidated API status:', error);
    
    return res.status(500).json({
      error: 'Failed to check API status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
