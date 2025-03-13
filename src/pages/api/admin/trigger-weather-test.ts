import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API Route hit - Method:', req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Request body:', req.body);
    
    // Get GitHub token and repo from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO_PATH = process.env.GITHUB_REPO || 'AaronVick/construction_weather';
    const [GITHUB_ORG, GITHUB_REPO] = GITHUB_REPO_PATH.split('/');

    console.log('GitHub repo path:', GITHUB_REPO_PATH);
    console.log('GitHub token exists:', !!GITHUB_TOKEN);

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    // Initialize Octokit with GitHub token
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    const {
      location,
      testDate,
      overrideConditions,
      conditionOverrides,
      sendTestEmail,
      testEmailRecipients,
      dryRun,
      debug
    } = req.body;

    // Validate required fields
    if (!location) {
      console.log('Location is missing from request body');
      return res.status(400).json({ error: 'Location is required' });
    }

    // Prepare workflow inputs
    const workflowInputs = {
      location: JSON.stringify(location),
      test_date: testDate,
      override_conditions: overrideConditions,
      condition_overrides: JSON.stringify(conditionOverrides),
      send_test_email: sendTestEmail,
      test_email_recipients: testEmailRecipients,
      dry_run: dryRun,
      debug: debug
    };

    console.log('Triggering workflow with inputs:', workflowInputs);

    // Trigger the weather-check workflow
    const { data } = await octokit.rest.actions.createWorkflowDispatch({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      workflow_id: 'weather-check.yml',
      ref: 'main',
      inputs: workflowInputs
    });

    console.log('Workflow dispatch response:', data);

    // Get the latest workflow run
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      workflow_id: 'weather-check.yml',
      per_page: 1
    });

    const latestRun = runs.workflow_runs[0];
    console.log('Latest workflow run:', latestRun);

    return res.status(200).json({
      message: 'Weather test workflow triggered successfully',
      workflowRunId: latestRun.id,
      htmlUrl: latestRun.html_url,
      status: latestRun.status
    });
  } catch (error) {
    console.error('Error triggering weather test workflow:', error);
    return res.status(500).json({
      error: 'Failed to trigger weather test workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 