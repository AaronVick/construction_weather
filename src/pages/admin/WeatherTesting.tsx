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
  TextField,
  Link
} from '@mui/material';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface WeatherTestFormData {
  zipcode: string;
}

const WeatherTesting: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
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
  const { register, handleSubmit, formState: { errors } } = useForm<WeatherTestFormData>({
    defaultValues: {
      zipcode: ''
    }
  });

  // Handle form submission
  const onSubmit = async (data: WeatherTestFormData) => {
    console.log('Testing weather API for zipcode:', data.zipcode);
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const token = await getIdToken();
      console.log('Authentication token obtained');
      
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/simple-weather-test?zip=${data.zipcode}`;
      
      console.log('Sending request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to trigger weather test');
      }
      
      setResult(responseData);
      
    } catch (error) {
      console.error('Error testing weather API:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box mb={4}>
      <Typography variant="h4" gutterBottom>Weather API Testing</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the weather API connection by triggering a GitHub workflow test.
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Zip Code Input */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Zip Code"
                {...register('zipcode', {
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
                  {loading ? 'Triggering Test...' : 'Test Weather API'}
                </Button>
              </Box>
            </Grid>
            
            {/* Error Message */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
            
            {/* Success Message */}
            {result && (
              <Grid item xs={12}>
                <Alert severity="success">
                  {result.message}
                </Alert>
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    GitHub Workflow Details:
                  </Typography>
                  <Typography variant="body1">
                    Status: {result.status || 'Pending'}
                  </Typography>
                  <Typography variant="body1">
                    Location Tested: {result.location || result.locationTested || "Pending..."}
                  </Typography>
                  {result.workflowRunUrl && (
                    <Box mt={1}>
                      <Button
                        variant="outlined"
                        color="primary"
                        component="a"
                        href={result.workflowRunUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Test Results on GitHub
                      </Button>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary" mt={2}>
                    Note: It may take a few moments for the workflow to start and complete. Check GitHub Actions for detailed results.
                  </Typography>
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