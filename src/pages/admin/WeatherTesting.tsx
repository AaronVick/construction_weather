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

interface WeatherTestFormData {
  zipcode: string;
}

interface WeatherTestResult {
  success: boolean;
  message: string;
  location?: string;
  region?: string;
  country?: string;
  temperature?: number;
  condition?: string;
  workflowTriggered?: boolean;
  workflow?: {
    workflowRunId: string;
    workflowRunUrl: string;
    status: string;
  };
  error?: string;
  details?: any;
}

const WeatherTesting: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeatherTestResult | null>(null);
  
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
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/simple-weather-test?zip=${data.zipcode}`;
      
      console.log('Sending request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      const responseData: WeatherTestResult = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to test weather API');
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
        Test if the WeatherAPI.com integration is working correctly.
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
                  {loading ? 'Testing API...' : 'Test Weather API'}
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
            {result && result.success && (
              <Grid item xs={12}>
                <Alert severity="success">
                  {result.message}
                </Alert>
                
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Weather Data
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Location:</strong> {result.location}, {result.region}, {result.country}
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Temperature:</strong> {result.temperature}°F
                  </Typography>
                  
                  <Typography variant="body1">
                    <strong>Conditions:</strong> {result.condition}
                  </Typography>
                  
                  {result.workflowTriggered && result.workflow && (
                    <>
                      <Box mt={3} mb={1}>
                        <Typography variant="h6">
                          GitHub Workflow
                        </Typography>
                        
                        <Typography variant="body1">
                          <strong>Status:</strong> {result.workflow.status}
                        </Typography>
                        
                        <Box mt={1}>
                          <Button
                            variant="outlined"
                            color="primary"
                            component="a"
                            href={result.workflow.workflowRunUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                          >
                            View on GitHub
                          </Button>
                        </Box>
                      </Box>
                    </>
                  )}
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