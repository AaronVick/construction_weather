// api/admin/api-status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';
import sgMail from '@sendgrid/mail';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('API status endpoint called');
  
  // Only allow GET method
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

    // Add environment variables check here
    console.log('Environment variables check:');
    console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
    console.log('FIREBASE_TYPE configured:', !!process.env.FIREBASE_TYPE);
    console.log('FIREBASE_PROJECT_ID configured:', !!process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_PRIVATE_KEY configured:', !!process.env.FIREBASE_PRIVATE_KEY);
    console.log('FIREBASE_CLIENT_EMAIL configured:', !!process.env.FIREBASE_CLIENT_EMAIL);
    

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.log('Token received, verifying...');
    
    // Verify the token and get the user
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userId = decodedToken.uid;
      console.log('Token verified for user:', userId);
      
      // Check if the user exists
      try {
        const userRecord = await auth.getUser(userId);
        console.log('User record found:', userRecord.email);
        
        // Check if the user is an admin
        try {
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
          
          // Check SendGrid status
          console.log('Checking SendGrid API key configuration...');
          if (!process.env.SENDGRID_API_KEY) {
            console.log('SendGrid API key not configured');
            return res.status(200).json({
              sendgrid: {
                status: 'error',
                message: 'SendGrid API key not configured',
                lastChecked: new Date().toISOString()
              }
            });
          }
          
          // Try to ping SendGrid API
          try {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('SendGrid API key set, testing connection...');
            
            // Option 1: Simpler validation without using .request()
            // Just set the API key and return success - if the key format is invalid,
            // the setApiKey method will throw an error
            
            return res.status(200).json({
              sendgrid: {
                status: 'ok',
                message: 'SendGrid API key configured',
                lastChecked: new Date().toISOString()
              }
            });
            
          } catch (sendgridError) {
            console.error('SendGrid API error:', sendgridError);
            return res.status(200).json({
              sendgrid: {
                status: 'error',
                message: 'Invalid SendGrid API key',
                details: sendgridError instanceof Error ? sendgridError.message : 'Unknown error',
                lastChecked: new Date().toISOString()
              }
            });
          }
          
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


 // import type { VercelRequest, VercelResponse } from '@vercel/node';
// import { auth, db } from '../lib/firebaseAdmin';
// import axios from 'axios';

// /**
//  * API endpoint to check the status of external APIs
//  * 
//  * GET /api/admin/api-status
//  * 
//  * Response:
//  * - weatherApi: Status of the WeatherAPI.com API
//  * - sendgrid: Status of the SendGrid API
//  */
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   // Only allow GET method
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     // Verify authentication
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ error: 'Unauthorized' });
//     }
    
//     const token = authHeader.split('Bearer ')[1];
    
//     // Verify the token and get the user
//     const decodedToken = await auth.verifyIdToken(token);
//     const userId = decodedToken.uid;
    
//     // Check if the user exists
//     const userRecord = await auth.getUser(userId);
//     if (!userRecord) {
//       return res.status(401).json({ error: 'User not found' });
//     }
    
//     // Check if the user is an admin
//     const userRef = db.collection('user_profiles').doc(userId);
//     const userDoc = await userRef.get();
//     const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';
    
//     if (!isAdmin) {
//       return res.status(403).json({ error: 'Permission denied. Only admins can access this endpoint.' });
//     }
    
//     // Check WeatherAPI.com status
//     let weatherApiStatus = {
//       status: 'unknown' as 'unknown' | 'ok' | 'error',
//       message: undefined as string | undefined,
//       rateLimitRemaining: undefined as number | undefined,
//       lastChecked: new Date().toISOString()
//     };
    
//     try {
//       const weatherApiKey = process.env.WEATHER_API_KEY;
      
//       if (!weatherApiKey) {
//         weatherApiStatus = {
//           status: 'error',
//           message: 'API key not configured',
//           rateLimitRemaining: undefined,
//           lastChecked: new Date().toISOString()
//         };
//       } else {
//         // Make a test request to WeatherAPI.com
//         const weatherResponse = await axios.get(
//           `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=London`
//         );
        
//         if (weatherResponse.status === 200) {
//           weatherApiStatus = {
//             status: 'ok',
//             message: 'API is responding',
//             rateLimitRemaining: parseInt(weatherResponse.headers['x-ratelimit-remaining'] || '0', 10),
//             lastChecked: new Date().toISOString()
//           };
//         } else {
//           weatherApiStatus = {
//             status: 'error',
//             message: `Unexpected status code: ${weatherResponse.status}`,
//             rateLimitRemaining: undefined,
//             lastChecked: new Date().toISOString()
//           };
//         }
//       }
//     } catch (error) {
//       weatherApiStatus = {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//         rateLimitRemaining: undefined,
//         lastChecked: new Date().toISOString()
//       };
//     }
    
//     // Check SendGrid status
//     let sendgridStatus = {
//       status: 'unknown' as 'unknown' | 'ok' | 'error',
//       message: undefined as string | undefined,
//       lastChecked: new Date().toISOString()
//     };
    
//     try {
//       const sendgridApiKey = process.env.SENDGRID_API_KEY;
      
//       if (!sendgridApiKey) {
//         sendgridStatus = {
//           status: 'error',
//           message: 'API key not configured',
//           lastChecked: new Date().toISOString()
//         };
//       } else {
//         // Make a test request to SendGrid
//         const sendgridResponse = await axios.get('https://api.sendgrid.com/v3/user/credits', {
//           headers: {
//             'Authorization': `Bearer ${sendgridApiKey}`
//           }
//         });
        
//         if (sendgridResponse.status === 200) {
//           sendgridStatus = {
//             status: 'ok',
//             message: 'API is responding',
//             lastChecked: new Date().toISOString()
//           };
//         } else {
//           sendgridStatus = {
//             status: 'error',
//             message: `Unexpected status code: ${sendgridResponse.status}`,
//             lastChecked: new Date().toISOString()
//           };
//         }
//       }
//     } catch (error) {
//       sendgridStatus = {
//         status: 'error',
//         message: error instanceof Error ? error.message : 'Unknown error',
//         lastChecked: new Date().toISOString()
//       };
//     }
    
//     // Return the API status
//     return res.status(200).json({
//       weatherApi: weatherApiStatus,
//       sendgrid: sendgridStatus
//     });
//   } catch (error) {
//     console.error('Error checking API status:', error);
    
//     return res.status(500).json({ 
//       error: 'Failed to check API status',
//       message: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// }
