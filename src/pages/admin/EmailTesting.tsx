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
  fromEmail?: string;
  fromName?: string;
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
  const [apiStatusLoading, setApiStatusLoading] = useState<boolean>(true);
  
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
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Check SendGrid API status on component mount
  useEffect(() => {
    checkApiStatus();
  }, []);
  
  // Function to check API status with better error handling
  const checkApiStatus = async () => {
    setApiStatusLoading(true);
    console.log('Checking API status...');
    
    try {
      const token = await getIdToken();
      console.log('Auth token acquired');
      
      // First try the consolidated endpoint
      try {
        console.log('Trying consolidated endpoint...');
        const response = await fetch('/api/consolidated/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('API status response:', data);
          
          if (data.sendgrid) {
            setSendgridStatus({
              status: data.sendgrid.status,
              message: data.sendgrid.message,
              lastChecked: data.sendgrid.lastChecked,
              fromEmail: data.sendgrid.fromEmail,
              fromName: data.sendgrid.fromName
            });
            
            // Set form defaults if available
            if (data.sendgrid.fromEmail) {
              setValue('fromEmail', data.sendgrid.fromEmail);
            }
            if (data.sendgrid.fromName) {
              setValue('fromName', data.sendgrid.fromName);
            }
            
            setApiStatusLoading(false);
            return;
          }
        } else {
          console.error('Consolidated API error:', response.status);
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
        }
      } catch (consolidatedError) {
        console.error('Consolidated endpoint error:', consolidatedError);
      }
      
      // Try direct endpoint as fallback
      try {
        console.log('Trying direct endpoint...');
        const response = await fetch('/api/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Direct API status response:', data);
          
          if (data.sendgrid) {
            setSendgridStatus({
              status: data.sendgrid.status,
              message: data.sendgrid.message,
              lastChecked: data.sendgrid.lastChecked
            });
            setApiStatusLoading(false);
            return;
          }
        } else {
          console.error('Direct API error:', response.status);
        }
      } catch (directError) {
        console.error('Direct endpoint error:', directError);
      }
      
      // If both endpoints fail
      console.error('Both API status endpoints failed');
      setSendgridStatus({
        status: 'error',
        message: 'Unable to connect to API status endpoints',
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error checking API status:', error);
      setSendgridStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date().toISOString()
      });
    } finally {
      setApiStatusLoading(false);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: EmailTestFormData) => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    console.log('Submitting email test form...');
    
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
      
      // Prepare request body
      const requestBody = {
        testEmailRecipients: recipients,
        emailSubject: data.subject,
        emailBody: data.body,
        ...(data.fromEmail ? { fromEmail: data.fromEmail } : {}),
        ...(data.fromName ? { fromName: data.fromName } : {})
      };
      
      console.log('Sending test email with data:', {
        recipients: recipients.join(', '),
        subject: data.subject,
        hasFromEmail: !!data.fromEmail,
        hasFromName: !!data.fromName
      });
      
      // Try consolidated endpoint first
      let apiSuccess = false;
      let result;
      
      try {
        console.log('Trying consolidated endpoint for test email...');
        const response = await fetch('/api/consolidated/admin/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Consolidated endpoint response status:', response.status);
        
        if (response.ok) {
          result = await response.json();
          console.log('Test email success:', result);
          apiSuccess = true;
        } else {
          console.error('Test email error status:', response.status);
          try {
            const errorData = await response.json();
            console.error('Error details:', errorData);
          } catch (e) {
            console.error('Could not parse error response');
          }
        }
      } catch (consolidatedError) {
        console.error('Consolidated endpoint error:', consolidatedError);
      }
      
      // Try direct endpoint as fallback
      if (!apiSuccess) {
        try {
          console.log('Trying direct endpoint for test email...');
          const response = await fetch('/api/admin/test-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          console.log('Direct endpoint response status:', response.status);
          
          if (response.ok) {
            result = await response.json();
            console.log('Test email success:', result);
            apiSuccess = true;
          } else {
            console.error('Test email error from direct endpoint');
            try {
              const errorData = await response.json();
              console.error('Error details:', errorData);
            } catch (e) {
              console.error('Could not parse error response');
            }
          }
        } catch (directError) {
          console.error('Direct endpoint error:', directError);
        }
      }
      
      if (!apiSuccess) {
        throw new Error('Failed to send email through both API endpoints');
      }
      
      // Update state with result
      setTestResult(result);
      setSuccessSnackbar(true);
      
      // Refresh API status
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