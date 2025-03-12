// src/pages/admin/EmailTesting.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Grid, 
  Paper, 
  TextField, 
  Typography, 
  Alert,
  Divider,
  Card,
  CardContent,
  Snackbar,
  Link
} from '@mui/material';
import { 
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { format } from 'date-fns';

// GitHub workflow file names
const STATUS_WORKFLOW = 'sendgrid-status.yml';
const EMAIL_WORKFLOW = 'send-test-email.yml';

// Define types
interface EmailTestFormData {
  recipients: string;
  subject: string;
  body: string;
  fromEmail?: string;
  fromName?: string;
}

interface SendgridStatus {
  status: 'unknown' | 'ok' | 'error';
  message?: string;
  lastChecked?: string;
  fromEmail?: string;
  fromName?: string;
}

interface WorkflowRunStatus {
  id: number;
  name?: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'unknown';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  created_at: string;
  repository?: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  workflowRun?: WorkflowRunStatus;
  details?: {
    statusCode?: number;
    recipients?: string[];
    subject?: string;
  };
}

// Function to trigger a GitHub workflow via our API
const triggerGitHubWorkflow = async (
  workflowFileName: string, 
  inputs: Record<string, string>,
  token: string
): Promise<{ runId: number, repository: string }> => {
  const response = await fetch('/api/github/trigger-workflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      workflow: workflowFileName,
      inputs,
      ref: 'main'
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to trigger workflow: ${errorData.error || response.statusText}`);
  }

  const data = await response.json();
  if (!data.runId) {
    throw new Error('Workflow was triggered but no run ID was returned');
  }
  
  return { 
    runId: data.runId,
    repository: data.repoPath || 'AaronVick/construction_weather'
  };
};

// Function to check the status of a GitHub workflow run
const checkWorkflowRunStatus = async (runId: number, token: string): Promise<WorkflowRunStatus> => {
  const response = await fetch(`/api/github/workflow-status?runId=${runId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check workflow status: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    status: data.status || 'unknown',
    conclusion: data.conclusion,
    html_url: data.html_url,
    created_at: data.created_at,
    repository: data.repository
  };
};

const EmailTesting: React.FC = () => {
  // State for test results
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sendgridStatus, setSendgridStatus] = useState<SendgridStatus>({ status: 'unknown' });
  const [successSnackbar, setSuccessSnackbar] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  
  // State for workflow monitoring
  const [activeWorkflowRunId, setActiveWorkflowRunId] = useState<number | null>(null);
  const [repoPath, setRepoPath] = useState<string>('AaronVick/construction_weather');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form with react-hook-form
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<EmailTestFormData>({
    defaultValues: {
      recipients: '',
      subject: 'Test Email from Construction Weather',
      body: 'This is a test email to verify that our notification system is working correctly.',
      fromEmail: '',
      fromName: ''
    }
  });
  
  // Check SendGrid API status on component mount
  useEffect(() => {
    checkSendGridStatus();
  }, []);
  
  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Function to check SendGrid status using GitHub workflow
  const checkSendGridStatus = async () => {
    setStatusLoading(true);
    setError(null);
    
    try {
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      
      // Trigger the GitHub workflow to check SendGrid status
      console.log('Triggering SendGrid status check workflow...');
      const { runId, repository } = await triggerGitHubWorkflow(
        STATUS_WORKFLOW,
        { requester: user?.email || 'unknown' },
        token
      );
      
      console.log(`Workflow run started with ID: ${runId}`);
      setActiveWorkflowRunId(runId);
      setRepoPath(repository);
      
      // Poll for workflow completion
      const checkInterval = setInterval(async () => {
        try {
          const status = await checkWorkflowRunStatus(runId, token);
          console.log('Workflow status:', status);
          
          if (status.status === 'completed') {
            clearInterval(checkInterval);
            setPollingInterval(null);
            
            if (status.conclusion === 'success') {
              // In a real implementation, we would fetch the artifact from GitHub
              // For now, we'll just set a simulated success status
              setSendgridStatus({
                status: 'ok',
                message: 'SendGrid API key is properly configured',
                lastChecked: new Date().toISOString(),
                // These would ideally come from the workflow results
                fromEmail: 'notifications@constructionweather.com',
                fromName: 'Construction Weather Alerts'
              });
            } else {
              setSendgridStatus({
                status: 'error',
                message: 'SendGrid API key check failed. See workflow logs for details.',
                lastChecked: new Date().toISOString()
              });
            }
            setStatusLoading(false);
          }
        } catch (error) {
          console.error('Error checking workflow status:', error);
          clearInterval(checkInterval);
          setPollingInterval(null);
          setSendgridStatus({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error checking workflow status',
            lastChecked: new Date().toISOString()
          });
          setStatusLoading(false);
        }
      }, 5000); // Check every 5 seconds
      
      setPollingInterval(checkInterval);
      
    } catch (error) {
      console.error('Error triggering status workflow:', error);
      setSendgridStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      });
      setStatusLoading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: EmailTestFormData) => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    console.log('Submitting email test form...');
    
    try {
      // Get Firebase ID token for authentication
      const token = await getIdToken();
      
      // Parse recipients
      const recipients = data.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      
      if (recipients.length === 0) {
        throw new Error('At least one valid email recipient is required');
      }
      
      // Prepare workflow inputs
      const workflowInputs = {
        recipients: recipients.join(','),
        subject: data.subject,
        body: data.body,
        fromEmail: data.fromEmail || '',
        fromName: data.fromName || ''
      };
      
      console.log('Triggering send test email workflow with inputs:', workflowInputs);
      
      // Trigger the GitHub workflow to send test email
      const { runId, repository } = await triggerGitHubWorkflow(
        EMAIL_WORKFLOW,
        workflowInputs,
        token
      );
      
      console.log(`Email workflow run started with ID: ${runId}`);
      setActiveWorkflowRunId(runId);
      setRepoPath(repository);
      
      // Poll for workflow completion
      const checkInterval = setInterval(async () => {
        try {
          const status = await checkWorkflowRunStatus(runId, token);
          console.log('Email workflow status:', status);
          
          if (status.status === 'completed') {
            clearInterval(checkInterval);
            setPollingInterval(null);
            
            if (status.conclusion === 'success') {
              // Set success result
              const result: EmailTestResult = {
                success: true,
                message: `Test email sent successfully to ${recipients.join(', ')}`,
                workflowRun: status,
                details: {
                  recipients,
                  subject: data.subject
                }
              };
              
              setTestResult(result);
              setSuccessSnackbar(true);
            } else {
              // Set failure result
              setTestResult({
                success: false,
                message: 'Failed to send test email. See workflow logs for details.',
                workflowRun: status
              });
            }
            
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking email workflow status:', error);
          clearInterval(checkInterval);
          setPollingInterval(null);
          setError(error instanceof Error ? error.message : 'Unknown error checking workflow status');
          setLoading(false);
        }
      }, 5000); // Check every 5 seconds
      
      setPollingInterval(checkInterval);
      
    } catch (error) {
      console.error('Error triggering email workflow:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoading(false);
    }
  };
  
  // Render SendGrid status indicator
  const renderSendgridStatus = () => {
    let icon;
    let color;
    
    if (sendgridStatus.status === 'ok') {
      icon = <CheckCircleIcon />;
      color = 'success.main';
    } else if (sendgridStatus.status === 'error') {
      icon = <ErrorIcon />;
      color = 'error.main';
    } else {
      icon = <CircularProgress size={20} />;
      color = 'info.main';
    }
    
    return (
      <Box mb={3}>
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <Box color={color} mr={1}>
                  {icon}
                </Box>
                <Typography variant="body1">
                  SendGrid: {sendgridStatus.status === 'ok' ? 'Connected' : 
                             sendgridStatus.status === 'error' ? 'Error' : 'Checking...'}
                  {sendgridStatus.message && ` - ${sendgridStatus.message}`}
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={checkSendGridStatus}
                disabled={statusLoading}
                startIcon={statusLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              >
                {statusLoading ? 'Checking...' : 'Refresh Status'}
              </Button>
            </Box>
            {sendgridStatus.lastChecked && (
              <Typography variant="caption" color="text.secondary">
                Last checked: {format(new Date(sendgridStatus.lastChecked), 'MMM d, yyyy h:mm a')}
              </Typography>
            )}
            {activeWorkflowRunId && (
              <Box mt={1}>
                <Link 
                  href={`https://github.com/${repoPath}/actions/runs/${activeWorkflowRunId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  display="flex"
                  alignItems="center"
                >
                  <GitHubIcon fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">View workflow run on GitHub</Typography>
                </Link>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };
  
  return (
    <Box mb={4}>
      <Typography variant="h4" gutterBottom>Email Notification Testing</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the email notification system to ensure SendGrid is properly configured and working for general users.
        This tool uses GitHub Actions workflows to send and check email functionality.
      </Typography>
      
      {renderSendgridStatus()}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Send Test Email</Typography>
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Recipients */}
            <Grid item xs={12}>
              <Controller
                name="recipients"
                control={control}
                rules={{ 
                  required: 'Email recipients are required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}(,\s*[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})*$/i,
                    message: 'Enter valid email addresses separated by commas'
                  }
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Recipients"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Enter email addresses separated by commas'}
                  />
                )}
              />
            </Grid>
            
            {/* Subject */}
            <Grid item xs={12}>
              <Controller
                name="subject"
                control={control}
                rules={{ required: 'Subject is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Subject"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            
            {/* Body */}
            <Grid item xs={12}>
              <Controller
                name="body"
                control={control}
                rules={{ required: 'Email body is required' }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Email Body"
                    fullWidth
                    required
                    multiline
                    rows={6}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message || 'Plain text or simple HTML supported'}
                  />
                )}
              />
            </Grid>
            
            {/* Advanced Options */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Advanced Options (Optional)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fromEmail"
                    control={control}
                    rules={{ 
                      pattern: {
                        value: /^$|^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Enter a valid email address'
                      }
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="From Email"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || 'Leave blank to use default'}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="fromName"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="From Name"
                        fullWidth
                        helperText="Leave blank to use default"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || sendgridStatus.status !== 'ok'}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                  {loading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </Box>
            </Grid>
            
            {/* Error Message */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
      
      {/* Test Results */}
      {testResult && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>Test Results</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Alert severity={testResult.success ? "success" : "error"} sx={{ mb: 2 }}>
            {testResult.message}
          </Alert>
          
          {testResult.workflowRun && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>Workflow Details:</Typography>
              <Typography variant="body2">
                Status: {testResult.workflowRun.status}
              </Typography>
              <Typography variant="body2">
                Conclusion: {testResult.workflowRun.conclusion || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  Created: {format(new Date(testResult.workflowRun.created_at), 'MMM d, yyyy h:mm a')}
                </Typography>
                <Box mt={1}>
                  <Link 
                    href={testResult.workflowRun.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    display="flex"
                    alignItems="center"
                  >
                    <GitHubIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">View workflow details on GitHub</Typography>
                  </Link>
                </Box>
              </Box>
            )}
          </Paper>
        )}
        
        {/* Success Snackbar */}
        <Snackbar
          open={successSnackbar}
          autoHideDuration={6000}
          onClose={() => setSuccessSnackbar(false)}
          message="Test email sent successfully"
        />
      </Box>
    );
  };
  
  export default EmailTesting;