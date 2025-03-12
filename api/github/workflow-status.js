// api/github/workflow-status.js
import { auth } from '../../src/lib/firebaseAdmin';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get GitHub token and repo from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO_PATH = process.env.GITHUB_REPO || 'AaronVick/construction_weather';
    const [GITHUB_ORG, GITHUB_REPO] = GITHUB_REPO_PATH.split('/');

    // Verify the user is authenticated (Firebase)
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;
        
        // Optional: Check if user is admin
        const userRef = await auth.getUser(userId);
        console.log(`User authenticated: ${userRef.email}`);
        
      } catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      console.warn('No authentication provided');
      // Decide if you want to allow unauthenticated requests
      // return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if GitHub token is available
    if (!GITHUB_TOKEN) {
      console.error('GitHub token not configured');
      return res.status(500).json({ error: 'GitHub token not configured on the server' });
    }

    // Get run ID from query parameters
    const { runId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'Workflow run ID is required' });
    }

    console.log(`Checking status of workflow run ${runId}`);

    // Get workflow run status
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/actions/runs/${runId}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return res.status(response.status).json({ 
        error: 'Failed to get GitHub workflow status',
        details: errorText
      });
    }

    const data = await response.json();
    
    // Check if we can also get the logs or artifacts
    let artifactsUrl = null;
    try {
      if (data.status === 'completed' && data.conclusion === 'success') {
        // Get artifacts if available
        const artifactsResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/actions/runs/${runId}/artifacts`,
          {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );
        
        if (artifactsResponse.ok) {
          const artifactsData = await artifactsResponse.json();
          if (artifactsData.artifacts && artifactsData.artifacts.length > 0) {
            artifactsUrl = artifactsData.artifacts[0].archive_download_url;
          }
        }
      }
    } catch (artifactError) {
      console.warn('Error getting artifacts:', artifactError);
      // Non-critical, continue without artifacts
    }

    // Return the workflow status
    return res.status(200).json({
      id: data.id,
      name: data.name,
      status: data.status,
      conclusion: data.conclusion,
      html_url: data.html_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      repository: GITHUB_REPO_PATH,
      artifacts_url: artifactsUrl
    });
  } catch (error) {
    console.error('Error checking GitHub workflow status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}