// api/github/workflow-status.js
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

    // Skip Firebase authentication for now to simplify debugging

    // Check if GitHub token is available
    if (!GITHUB_TOKEN) {
      console.error('GitHub token not configured');
      return res.status(500).json({ 
        error: 'GitHub token not configured on the server',
        message: 'Please check server environment variables'
      });
    }

    // Get run ID from query parameters
    const { runId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'Workflow run ID is required' });
    }

    console.log(`Checking status of workflow run ${runId}`);

    try {
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
          details: errorText,
          status: response.status
        });
      }

      const data = await response.json();
      
      // Return the workflow status
      return res.status(200).json({
        id: data.id,
        name: data.name,
        status: data.status,
        conclusion: data.conclusion,
        html_url: data.html_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
        repository: GITHUB_REPO_PATH
      });
    } catch (fetchError) {
      console.error('Fetch error checking workflow status:', fetchError);
      return res.status(500).json({
        error: 'Error communicating with GitHub API',
        message: fetchError.message || 'Network error occurred'
      });
    }
  } catch (error) {
    console.error('General error in workflow-status endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    });
  }
}