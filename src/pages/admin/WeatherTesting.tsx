// src/pages/admin/WeatherTesting.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Grid, 
  Paper, 
  Typography,
  Alert,
  TextField
} from '@mui/material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface WeatherTestFormData {
  zipcode: string;
}

const WeatherTesting: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  
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
  const { control, handleSubmit, formState: { errors } } = useForm<WeatherTestFormData>({
    defaultValues: {
      zipcode: ''
    }
  });

  // Handle form submission
  const onSubmit = async (data: WeatherTestFormData) => {
    console.log('Testing weather API for zipcode:', data.zipcode);
    setLoading(true);
    setError(null);
    setWorkflowStatus(null);
    
    try {
      const token = await getIdToken();
      
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      
      // Trigger the GitHub workflow
      const response = await fetch(`${baseUrl}/api/admin/trigger-weather-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: {
            type: 'zipcode',
            zipcode: data.zipcode
          },
          testDate: new Date().toISOString(),
          overrideConditions: false,
          dryRun: true,
          debug: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger weather test');
      }
      
      const result = await response.json();
      setWorkflowStatus(result);
      
    } catch (error) {
      console.error('Error triggering weather test:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box mb={4}>
      <Typography variant="h4" gutterBottom>Weather API Testing</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test if the weather API is working by triggering a GitHub workflow test.
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Zip Code Input */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zip Code"
                {...control.register('zipcode', {
                  required: 'Zip code is required',
                  pattern: {
                    value: /^\d{5}(-\d{4})?$/,
                    message: 'Please enter a valid zip code'
                  }
                })}
                error={!!errors.zipcode}
                helperText={errors.zipcode?.message}
              />
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-start">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Triggering Test...' : 'Trigger Weather API Test'}
                </Button>
              </Box>
            </Grid>
            
            {/* Error Message */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            
            {/* Workflow Status */}
            {workflowStatus && (
              <Grid item xs={12}>
                <Alert severity="success">
                  Weather test workflow triggered successfully!
                </Alert>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Workflow Details:
                  </Typography>
                  <pre style={{ overflow: 'auto' }}>
                    {JSON.stringify(workflowStatus, null, 2)}
                  </pre>
                </Paper>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default WeatherTesting;
