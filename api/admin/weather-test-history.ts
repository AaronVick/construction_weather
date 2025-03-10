// api/admin/weather-test-history.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../lib/firebaseAdmin';

/**
 * API endpoint to fetch weather test history
 * 
 * GET /api/admin/weather-test-history
 * 
 * Response:
 * - history: Array of weather test history items
 */
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
    
    // Get query parameters
    const { limit = '10' } = req.query;
    
    // Parse limit
    const parsedLimit = parseInt(limit as string, 10);
    const actualLimit = isNaN(parsedLimit) ? 10 : Math.min(parsedLimit, 100);
    
    // Query for weather test history
    const historyQuery = db.collection('weather_test_history')
      .where('user_id', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(actualLimit);
    
    // Execute the query
    const historySnapshot = await historyQuery.get();
    
    // Format the results
    const history = historySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp.toDate().toISOString(),
        weatherData: data.weatherData,
        thresholds: data.thresholds,
        triggeredConditions: data.triggeredConditions || [],
        notificationPreview: data.notificationPreview || {
          subject: 'Weather Alert',
          recipients: [],
          templateId: 'default',
          templateData: {}
        },
        emailSent: data.emailSent || false,
        emailResponse: data.emailResponse,
        logs: data.logs || []
      };
    });
    
    // Return the history
    return res.status(200).json({
      history,
      count: history.length,
      limit: actualLimit
    });
  } catch (error) {
    console.error('Error fetching weather test history:', error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch weather test history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
