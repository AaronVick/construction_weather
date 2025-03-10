// api/admin/jobsites.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { auth, db } from '../lib/firebaseAdmin';

/**
 * API endpoint to fetch jobsites for admin testing
 * 
 * GET /api/admin/jobsites
 * 
 * Response:
 * - jobsites: Array of jobsites with basic information
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
    const { limit = '100', active = 'true' } = req.query;
    
    // Parse limit
    const parsedLimit = parseInt(limit as string, 10);
    const actualLimit = isNaN(parsedLimit) ? 100 : Math.min(parsedLimit, 1000);
    
    // Parse active
    const isActive = active === 'true';
    
    // Query for jobsites
    let jobsitesQuery: any = db.collection('jobsites');
    
    // Filter by active status if specified
    if (isActive) {
      jobsitesQuery = jobsitesQuery.where('is_active', '==', true);
    }
    
    // Limit the number of results
    jobsitesQuery = jobsitesQuery.limit(actualLimit);
    
    // Execute the query
    const jobsitesSnapshot = await jobsitesQuery.get();
    
    // Format the results
    const jobsites = jobsitesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Jobsite',
        address: data.address,
        zipCode: data.zip_code,
        latitude: data.latitude,
        longitude: data.longitude,
        isActive: data.is_active || false,
        userId: data.user_id
      };
    });
    
    // Return the jobsites
    return res.status(200).json({
      jobsites,
      count: jobsites.length,
      limit: actualLimit
    });
  } catch (error) {
    console.error('Error fetching jobsites:', error);
    
    return res.status(500).json({ 
      error: 'Failed to fetch jobsites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
