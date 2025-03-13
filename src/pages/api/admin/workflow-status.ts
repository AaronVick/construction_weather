import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from '@octokit/rest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { runId } = req.query;

    if (!runId) {
      return res.status(400).json({ error: 'Workflow run ID is required' });
    }

    // Get GitHub token and repo from environment variables
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO_PATH = process.env.GITHUB_REPO || 'AaronVick/construction_weather';
    const [GITHUB_ORG, GITHUB_REPO] = GITHUB_REPO_PATH.split('/');

    if (!GITHUB_TOKEN) {
      throw new Error('GitHub token is not configured');
    }

    // Initialize Octokit with GitHub token
    const octokit = new Octokit({
      auth: GITHUB_TOKEN
    });

    // Get workflow run details
    const { data: run } = await octokit.rest.actions.getWorkflowRun({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      run_id: Number(runId)
    });

    // Get workflow jobs
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner: GITHUB_ORG,
      repo: GITHUB_REPO,
      run_id: Number(runId)
    });

    // Format the response
    const status = {
      status: run.status,
      conclusion: run.conclusion,
      jobs: jobs.jobs.map(job => ({
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        startedAt: job.started_at,
        completedAt: job.completed_at
      })),
      logsUrl: run.logs_url,
      htmlUrl: run.html_url
    };

    return res.status(200).json(status);
  } catch (error) {
    console.error('Error checking workflow status:', error);
    return res.status(500).json({
      error: 'Failed to check workflow status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 