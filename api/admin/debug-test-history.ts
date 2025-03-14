// api/admin/debug-test-history.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../../src/lib/firebaseAdmin';

/**
 * API endpoint to fetch debug test history for the test-debug-mode.yml workflow
 * 
 * GET /api/admin/debug-test-history
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Number of items per page (default: 10, max: 50)
 * 
 * Response:
 * - history: Array of debug test history items
 * - total: Total number of history items
 * - page: Current page
 * - limit: Items per page
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
    const { page = '1', limit = '10', runId } = req.query;
    
    // If runId is provided, fetch details for a specific run
    if (runId) {
      const runDoc = await db.collection('weather_notification_runs').doc(runId as string).get();
      
      if (!runDoc.exists) {
        return res.status(404).json({ error: 'Debug test run not found' });
      }
      
      const runData = runDoc.data();
      
      // Return the run details
      return res.status(200).json({
        id: runDoc.id,
        ...runData,
        timestamp: runData?.timestamp?.toDate().toISOString() || null
      });
    }
    
    // Parse pagination parameters
    const parsedPage = parseInt(page as string, 10);
    const parsedLimit = parseInt(limit as string, 10);
    
    const actualPage = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);
    const actualLimit = isNaN(parsedLimit) ? 10 : Math.min(Math.max(1, parsedLimit), 50);
    const offset = (actualPage - 1) * actualLimit;
    
    // Query for debug test history
    const countQuery = db.collection('weather_notification_runs')
      .where('debug_mode', '==', true);
    
    const historyQuery = db.collection('weather_notification_runs')
      .where('debug_mode', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(actualLimit)
      .offset(offset);
    
    // Execute the queries
    const [countSnapshot, historySnapshot] = await Promise.all([
      countQuery.count().get(),
      historyQuery.get()
    ]);
    
    const total = countSnapshot.data().count;
    
    // Format the results
    const history = historySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        timestamp: data.timestamp?.toDate().toISOString() || null,
        success: data.success || false,
        users_processed: data.users_processed || 0,
        successful_checks: data.successful_checks || 0,
        failed_checks: data.failed_checks || 0,
        notifications_sent: data.notifications_sent || 0,
        error: data.error || null
      };
    });
    
    // Return the history
    return res.status(200).json({
      history,
      total,
      page: actualPage,
      limit: actualLimit,
      pages: Math.ceil(total / actualLimit)
    });
  } catch (error) {
    console.error('Error fetching debug test history:', error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch debug test history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
