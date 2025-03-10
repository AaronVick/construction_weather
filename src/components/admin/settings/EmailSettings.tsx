// src/components/admin/settings/EmailSettings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  TextField, 
  Typography, 
  Grid, 
  Alert, 
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';

interface EmailSettingsFormData {
  fromEmail: string;
  fromName: string;
  testEmail: string;
  emailSubject: string;
  emailBody: string;
}

const EmailSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendgridStatus, setSendgridStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [sendgridStatusMessage, setSendgridStatusMessage] = useState<string>('Checking SendGrid status...');
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<EmailSettingsFormData>({
    defaultValues: {
      fromEmail: '',
      fromName: 'Construction Weather Alerts',
      testEmail: '',
      emailSubject: 'Test Email from Construction Weather',
      emailBody: 'This is a test email from the Construction Weather application. If you received this email, the email functionality is working correctly.'
    }
  });
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Check SendGrid status on component mount
  useEffect(() => {
    const checkSendgridStatus = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to check API status');
        }
        
        const data = await response.json();
        
        if (data.sendgrid?.status === 'ok') {
          setSendgridStatus('ok');
          setSendgridStatusMessage('SendGrid is configured and working correctly.');
          
          // Set from email if available
          if (data.sendgrid?.fromEmail) {
            setValue('fromEmail', data.sendgrid.fromEmail);
          }
          
          // Set from name if available
          if (data.sendgrid?.fromName) {
            setValue('fromName', data.sendgrid.fromName);
          }
        } else {
          setSendgridStatus('error');
          setSendgridStatusMessage(data.sendgrid?.message || 'SendGrid is not configured correctly.');
        }
      } catch (error) {
        console.error('Error checking SendGrid status:', error);
        setSendgridStatus('error');
        setSendgridStatusMessage('Failed to check SendGrid status. Please try again later.');
      }
    };
    
    checkSendgridStatus();
  }, [getIdToken, setValue]);
  
  // Handle form submission
  const onSubmit = async (data: EmailSettingsFormData) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Prepare request body
      const requestBody = {
        testEmailRecipients: [data.testEmail],
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        fromEmail: data.fromEmail,
        fromName: data.fromName
      };
      
      // Send request to API
      const response = await fetch('/api/consolidated/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test email');
      }
      
      const result = await response.json();
      
      setSuccess(`Test email sent successfully to ${data.testEmail}`);
    } catch (error) {
      console.error('Error sending test email:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Email Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure email settings and test email functionality.
      </Typography>
      
      {/* SendGrid Status */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="SendGrid Status" 
          subheader="Status of the SendGrid email service integration"
        />
        <CardContent>
          <Alert 
            severity={sendgridStatus === 'ok' ? 'success' : sendgridStatus === 'error' ? 'error' : 'info'}
            sx={{ mb: 2 }}
          >
            {sendgridStatusMessage}
          </Alert>
          
          <Typography variant="body2" color="text.secondary">
            SendGrid is used to send all emails from the application, including weather alerts and notifications.
            If SendGrid is not configured correctly, emails will not be sent.
          </Typography>
        </CardContent>
      </Card>
      
      {/* Test Email Form */}
      <Card>
        <CardHeader 
          title="Send Test Email" 
          subheader="Test email functionality by sending a test email"
        />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* From Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="From Email"
                  fullWidth
                  {...register('fromEmail', { required: 'From email is required' })}
                  error={!!errors.fromEmail}
                  helperText={errors.fromEmail?.message}
                  disabled={sendgridStatus !== 'ok'}
                />
              </Grid>
              
              {/* From Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="From Name"
                  fullWidth
                  {...register('fromName', { required: 'From name is required' })}
                  error={!!errors.fromName}
                  helperText={errors.fromName?.message}
                  disabled={sendgridStatus !== 'ok'}
                />
              </Grid>
              
              {/* Test Email Recipient */}
              <Grid item xs={12}>
                <TextField
                  label="Test Email Recipient"
                  fullWidth
                  {...register('testEmail', { 
                    required: 'Test email recipient is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={!!errors.testEmail}
                  helperText={errors.testEmail?.message}
                  disabled={sendgridStatus !== 'ok'}
                />
              </Grid>
              
              {/* Email Subject */}
              <Grid item xs={12}>
                <TextField
                  label="Email Subject"
                  fullWidth
                  {...register('emailSubject', { required: 'Email subject is required' })}
                  error={!!errors.emailSubject}
                  helperText={errors.emailSubject?.message}
                  disabled={sendgridStatus !== 'ok'}
                />
              </Grid>
              
              {/* Email Body */}
              <Grid item xs={12}>
                <TextField
                  label="Email Body"
                  fullWidth
                  multiline
                  rows={4}
                  {...register('emailBody', { required: 'Email body is required' })}
                  error={!!errors.emailBody}
                  helperText={errors.emailBody?.message}
                  disabled={sendgridStatus !== 'ok'}
                />
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || sendgridStatus !== 'ok'}
                    startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                  >
                    {loading ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </Box>
              </Grid>
              
              {/* Success Message */}
              {success && (
                <Grid item xs={12}>
                  <Alert severity="success">{success}</Alert>
                </Grid>
              )}
              
              {/* Error Message */}
              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailSettings;
