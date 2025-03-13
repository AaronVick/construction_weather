import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      dryRun
    } = req.body;

    // Validate required fields
    if (!location) {
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
      debug: true // Enable debug mode for testing
    };

    // Trigger the weather-check workflow
    const { data } = await octokit.rest.actions.createWorkflowDispatch({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      workflow_id: 'weather-check.yml',
      ref: 'main',
      inputs: workflowInputs
    });

    // The response from createWorkflowDispatch doesn't include the run ID
    // We need to get the latest workflow run
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      workflow_id: 'weather-check.yml',
      per_page: 1
    });

    const latestRun = runs.workflow_runs[0];

    return res.status(200).json({
      message: 'Weather test workflow triggered successfully',
      workflowRunId: latestRun.id
    });
  } catch (error) {
    console.error('Error triggering weather test workflow:', error);
    return res.status(500).json({
      error: 'Failed to trigger weather test workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 