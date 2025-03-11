// src/pages/admin/EmailTesting.tsx (Completed)
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
  Snackbar
} from '@mui/material';
import { 
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { format } from 'date-fns';

// Define types
interface EmailTestFormData {
  recipients: string;
  subject: string;
  body: string;
  fromEmail?: string;
  fromName?: string;
}

interface ApiStatus {
  status: 'unknown' | 'ok' | 'error';
  message?: string;
  lastChecked?: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  details?: {
    statusCode?: number;
    headers?: Record<string, string>;
    messageId?: string;
  };
}

const EmailTesting: React.FC = () => {
  // State for test results
  const [testResult, setTestResult] = useState<EmailTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sendgridStatus, setSendgridStatus] = useState<ApiStatus>({ status: 'unknown' });
  const [successSnackbar, setSuccessSnackbar] = useState<boolean>(false);
  const [apiStatusLoading, setApiStatusLoading] = useState<boolean>(false);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Initialize form
  const { control, handleSubmit, formState: { errors } } = useForm<EmailTestFormData>({
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
    checkApiStatus();
  }, []);
  
  // Function to check API status with better error handling
  const checkApiStatus = async () => {
    setApiStatusLoading(true);
    try {
      const token = await getIdToken();
      
      // Try consolidated endpoint first
      try {
        const response = await fetch('/api/consolidated/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API status from consolidated endpoint:', data);
          setSendgridStatus(data.sendgrid);
          setApiStatusLoading(false);
          return;
        } else {
          console.error('Consolidated API status returned non-OK response:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        const consolidatedError = error as Error;
        console.error('Error checking consolidated API status:', consolidatedError);
      }
      
      // Try direct endpoint
      try {
        const response = await fetch('/api/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API status from direct endpoint:', data);
          setSendgridStatus(data.sendgrid);
          setApiStatusLoading(false);
          return;
        } else {
          console.error('Direct API status returned non-OK response:', response.status);
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        const directError = error as Error;
        console.error('Error checking direct API status:', directError);
      }
      
      // If both API calls fail
      console.error('Both API status endpoints failed');
      setSendgridStatus({
        status: 'error',
        message: 'Unable to connect to SendGrid status API',
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking API status:', error);
      setSendgridStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        lastChecked: new Date().toISOString()
      });
    } finally {
      setApiStatusLoading(false);
    }
  };
  
  // Handle form submission with better error display
  const onSubmit = async (data: EmailTestFormData) => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const token = await getIdToken();
      
      // Parse recipients
      const recipients = data.recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      
      if (recipients.length === 0) {
        throw new Error('At least one valid email recipient is required');
      }
      
      // Define request body interface
      interface TestEmailRequestBody {
        testEmailRecipients: string[];
        emailSubject: string;
        emailBody: string;
        fromEmail?: string;
        fromName?: string;
      }
      
      // Prepare request body
      const requestBody: TestEmailRequestBody = {
        testEmailRecipients: recipients,
        emailSubject: data.subject,
        emailBody: data.body
      };
      
      // Add optional fields if provided
      if (data.fromEmail) requestBody.fromEmail = data.fromEmail;
      if (data.fromName) requestBody.fromName = data.fromName;
      
      // Try to send request to API - try consolidated endpoint first, then fall back to direct
      let apiSuccess = false;
      let result;
      let errorDetails = null;
      
      // Try consolidated endpoint
      console.log('Attempting to send email via consolidated endpoint...');
      try {
        const consolidatedResponse = await fetch('/api/consolidated/admin/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Consolidated API Response Status:', consolidatedResponse.status);
        
        // Handle specific HTTP status codes
        if (consolidatedResponse.status === 405) {
          console.error('Method not allowed: Ensure the endpoint supports POST requests');
          errorDetails = 'API endpoint does not support POST requests. This may indicate a server configuration issue.';
        }
        
        if (consolidatedResponse.ok) {
          result = await consolidatedResponse.json();
          console.log('Consolidated API Success:', result);
          apiSuccess = true;
        } else {
          const errorResponse = await consolidatedResponse.text();
          console.error('Consolidated API Error Response:', errorResponse);
          console.error('Status:', consolidatedResponse.status);
          
          // Don't set error yet, try the direct endpoint
          if (!errorDetails) {
            errorDetails = `Consolidated API failed (${consolidatedResponse.status}): ${errorResponse}`;
          }
        }
      } catch (error) {
        const consolidatedError = error as Error;
        console.error('Consolidated endpoint fetch error:', consolidatedError);
        errorDetails = `Network error with consolidated endpoint: ${consolidatedError.message || 'Unknown error'}`;
      }
      
      // Try direct endpoint if consolidated failed
      if (!apiSuccess) {
        console.log('Consolidated endpoint failed, trying direct endpoint...');
        try {
          const directResponse = await fetch('/api/admin/test-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('Direct API Response Status:', directResponse.status);
          
          if (directResponse.ok) {
            result = await directResponse.json();
            console.log('Direct API Success:', result);
            apiSuccess = true;
          } else {
            const errorResponse = await directResponse.text();
            console.error('Direct API Error Response:', errorResponse);
            console.error('Status:', directResponse.status);
            
            if (!errorDetails) {
              errorDetails = `Direct API failed (${directResponse.status}): ${errorResponse}`;
            }
          }
        } catch (error) {
          const directError = error as Error;
          console.error('Direct endpoint fetch error:', directError);
          if (!errorDetails) {
            errorDetails = `Network error with direct endpoint: ${directError.message || 'Unknown error'}`;
          }
        }
      }
      
      // If API calls failed, report the error
      if (!apiSuccess) {
        console.error('Both API endpoints failed');
        throw new Error(errorDetails || 'Failed to connect to email service. Please check network connection and server logs.');
      }
      
      // Update test results
      setTestResult(result);
      setSuccessSnackbar(true);
      
      // Refresh API status after successful send
      checkApiStatus();
    } catch (error) {
      console.error('Error sending test email:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
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
                onClick={checkApiStatus}
                disabled={apiStatusLoading}
                startIcon={apiStatusLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              >
                {apiStatusLoading ? 'Checking...' : 'Refresh Status'}
              </Button>
            </Box>
            {sendgridStatus.lastChecked && (
              <Typography variant="caption" color="text.secondary">
                Last checked: {format(new Date(sendgridStatus.lastChecked), 'MMM d, yyyy h:mm a')}
              </Typography>
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
                    disabled={loading}
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
            
            {testResult.details && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>Details:</Typography>
                <Typography variant="body2">
                  Status Code: {testResult.details.statusCode || 'N/A'}
                </Typography>
                {testResult.details.messageId && (
                  <Typography variant="body2">
                    Message ID: {testResult.details.messageId}
                  </Typography>
                )}
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
