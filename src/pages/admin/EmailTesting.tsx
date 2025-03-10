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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
// No need to import AdminLayoutWrapper as it's handled by the route structure
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
    headers?: any;
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
    const checkApiStatus = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to check API status');
        }
        
        const data = await response.json();
        setSendgridStatus(data.sendgrid);
      } catch (error) {
        console.error('Error checking API status:', error);
        setSendgridStatus({
          status: 'error',
          message: 'Failed to check status'
        });
      }
    };
    
    checkApiStatus();
  }, []);
  
  // Handle form submission
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
      
      // Prepare request body
      const requestBody: any = {
        testEmailRecipients: recipients,
        emailSubject: data.subject,
        emailBody: data.body
      };
      
      // Add optional fields if provided
      if (data.fromEmail) requestBody.fromEmail = data.fromEmail;
      if (data.fromName) requestBody.fromName = data.fromName;
      
      // Send request to API
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to send test email');
      }
      
      // Update test results
      setTestResult(result);
      setSuccessSnackbar(true);
    } catch (error) {
      console.error('Error sending test email:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh API status
  const handleRefreshApiStatus = async () => {
    try {
      const token = await getIdToken();
      const response = await fetch('/api/admin/api-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check API status');
      }
      
      const data = await response.json();
      setSendgridStatus(data.sendgrid);
    } catch (error) {
      console.error('Error checking API status:', error);
      setSendgridStatus({
        status: 'error',
        message: 'Failed to check status'
      });
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
      icon = <Alert severity="error" sx={{ mb: 0 }}>SendGrid Error</Alert>;
      color = 'error.main';
    } else {
      icon = <Alert severity="info" sx={{ mb: 0 }}>SendGrid Status Unknown</Alert>;
      color = 'info.main';
    }
    
    return (
      <Box mb={3}>
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                {sendgridStatus.status === 'ok' ? (
                  <>
                    <Box color={color} mr={1}>
                      {icon}
                    </Box>
                    <Typography variant="body1">
                      SendGrid: Connected
                      {sendgridStatus.message && ` - ${sendgridStatus.message}`}
                    </Typography>
                  </>
                ) : (
                  icon
                )}
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleRefreshApiStatus}
              >
                Refresh Status
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
                  Status Code: {testResult.details.statusCode}
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
