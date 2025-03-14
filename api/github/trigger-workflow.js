// api/github/trigger-workflow.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get GitHub token and repo from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO_PATH = process.env.GITHUB_REPO || 'AaronVick/construction_weather';
    const [GITHUB_ORG, GITHUB_REPO] = GITHUB_REPO_PATH.split('/');

    console.log('GitHub repo path:', GITHUB_REPO_PATH);

    // Verify the user is authenticated (Firebase)
    // Skip Firebase authentication for now to simplify debugging
    let userId = 'test-user';
    
    // Check if GitHub token is available
    if (!GITHUB_TOKEN) {
      console.error('GitHub token not configured in environment variables');
      return res.status(500).json({ 
        error: 'GitHub token not configured on the server',
        message: 'Please check server environment variables'
      });
    }

    // Get workflow details from request body
    const { workflow, inputs = {}, ref = 'main' } = req.body;

    if (!workflow) {
      return res.status(400).json({ error: 'Workflow filename is required' });
    }

    console.log(`Triggering workflow ${workflow} with inputs:`, inputs);

    try {
      // Trigger the GitHub workflow
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/actions/workflows/${workflow}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ref,
            inputs
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GitHub API error: ${response.status} ${response.statusText}`);
        console.error(errorText);
        return res.status(response.status).json({ 
          error: 'Failed to trigger GitHub workflow',
          details: errorText,
          status: response.status
        });
      }

      // The workflow dispatch endpoint doesn't return the run ID,
      // so we need to fetch the latest run
      const runsResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/actions/workflows/${workflow}/runs?per_page=1`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!runsResponse.ok) {
        console.error(`Failed to get workflow runs: ${runsResponse.statusText}`);
        return res.status(200).json({ 
          success: true,
          message: 'Workflow triggered, but could not retrieve run ID'
        });
      }

      const runsData = await runsResponse.json();
      const runId = runsData.workflow_runs && runsData.workflow_runs.length > 0 
        ? runsData.workflow_runs[0].id 
        : null;

      return res.status(200).json({
        success: true,
        message: 'GitHub workflow triggered successfully',
        runId,
        repoPath: GITHUB_REPO_PATH
      });
    } catch (fetchError) {
      console.error('Fetch error triggering GitHub workflow:', fetchError);
      return res.status(500).json({
        error: 'Error communicating with GitHub API',
        message: fetchError.message || 'Network error occurred'
      });
    }
  } catch (error) {
    console.error('General error in trigger-workflow endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unknown error occurred'
    });
  }
}