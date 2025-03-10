// src/pages/admin/WeatherTesting.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Grid, 
  Paper, 
  Tab, 
  Tabs, 
  Typography,
  Alert
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Send as SendIcon
} from '@mui/icons-material';
import AdminLayoutWrapper from '../../components/layout/AdminLayoutWrapper';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

// Import types
import { 
  WeatherTestFormData, 
  ApiStatus, 
  JobsiteOption, 
  WeatherTestResult 
} from '../../components/admin/weather-testing/types';

// Import components
import ApiStatusPanel from '../../components/admin/weather-testing/ApiStatusPanel';
import LocationSelector from '../../components/admin/weather-testing/LocationSelector';
import DateTimeSelector from '../../components/admin/weather-testing/DateTimeSelector';
import WeatherConditionOverrides from '../../components/admin/weather-testing/WeatherConditionOverrides';
import TestExecutionOptions from '../../components/admin/weather-testing/TestExecutionOptions';
import TestResultsView from '../../components/admin/weather-testing/TestResultsView';
import TestHistoryList from '../../components/admin/weather-testing/TestHistoryList';

const WeatherTesting: React.FC = () => {
  // State for test results
  const [testResults, setTestResults] = useState<WeatherTestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    weatherApi: { status: 'unknown' },
    sendgrid: { status: 'unknown' }
  });
  const [jobsites, setJobsites] = useState<JobsiteOption[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [testHistory, setTestHistory] = useState<WeatherTestResult[]>([]);
  
  // Get auth context
  const { user, isAuthenticated } = useFirebaseAuth();
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Initialize form
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<WeatherTestFormData>({
    defaultValues: {
      locationType: 'zipcode',
      zipcode: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      jobsiteId: '',
      testDate: new Date(),
      overrideConditions: false,
      conditions: {
        temperature: false,
        temperatureValue: 32,
        rain: false,
        rainProbability: 50,
        snow: false,
        snowAmount: 1,
        wind: false,
        windSpeed: 20,
        alert: false,
        alertType: 'Severe Weather'
      },
      sendTestEmail: false,
      testEmailRecipients: '',
      dryRun: true
    }
  });
  
  // Watch form values for conditional rendering
  const locationType = watch('locationType');
  const overrideConditions = watch('overrideConditions');
  const sendTestEmail = watch('sendTestEmail');
  const dryRun = watch('dryRun');
  
  // Fetch jobsites on component mount
  useEffect(() => {
    const fetchJobsites = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/jobsites', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch jobsites');
        }
        
        const data = await response.json();
        setJobsites(data.jobsites);
      } catch (error) {
        console.error('Error fetching jobsites:', error);
        setError('Failed to fetch jobsites. Please try again later.');
      }
    };
    
    fetchJobsites();
  }, [getIdToken]);
  
  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
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
        setApiStatus(data);
      } catch (error) {
        console.error('Error checking API status:', error);
        setApiStatus({
          weatherApi: { status: 'error', message: 'Failed to check status' },
          sendgrid: { status: 'error', message: 'Failed to check status' }
        });
      }
    };
    
    checkApiStatus();
    
    // Set up interval to check API status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getIdToken]);
  
  // Fetch test history on component mount
  useEffect(() => {
    const fetchTestHistory = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/weather-test-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch test history');
        }
        
        const data = await response.json();
        setTestHistory(data.history);
      } catch (error) {
        console.error('Error fetching test history:', error);
      }
    };
    
    fetchTestHistory();
  }, [getIdToken]);
  
  // Handle form submission
  const onSubmit = async (data: WeatherTestFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Prepare request body
      const requestBody: any = {
        testDate: data.testDate.toISOString(),
        overrideConditions: data.overrideConditions,
        sendTestEmail: data.sendTestEmail,
        dryRun: data.dryRun
      };
      
      // Add location data based on type
      if (data.locationType === 'zipcode') {
        requestBody.location = {
          type: 'zipcode',
          zipcode: data.zipcode
        };
      } else if (data.locationType === 'address') {
        requestBody.location = {
          type: 'address',
          address: data.address
        };
      } else if (data.locationType === 'coordinates') {
        requestBody.location = {
          type: 'coordinates',
          latitude: data.latitude,
          longitude: data.longitude
        };
      } else if (data.locationType === 'jobsite') {
        requestBody.location = {
          type: 'jobsite',
          jobsiteId: data.jobsiteId
        };
      }
      
      // Add condition overrides if enabled
      if (data.overrideConditions) {
        requestBody.conditionOverrides = {
          temperature: data.conditions.temperature ? data.conditions.temperatureValue : undefined,
          rainProbability: data.conditions.rain ? data.conditions.rainProbability : undefined,
          snowAmount: data.conditions.snow ? data.conditions.snowAmount : undefined,
          windSpeed: data.conditions.wind ? data.conditions.windSpeed : undefined,
          weatherAlert: data.conditions.alert ? data.conditions.alertType : undefined
        };
      }
      
      // Add test email recipients if sending test emails
      if (data.sendTestEmail) {
        requestBody.testEmailRecipients = data.testEmailRecipients
          .split(',')
          .map((email: string) => email.trim())
          .filter((email: string) => email);
      }
      
      // Send request to API
      const response = await fetch('/api/consolidated/admin/test-weather-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run weather notification test');
      }
      
      const result = await response.json();
      
      // Update test results
      setTestResults(result);
      
      // Switch to results tab
      setActiveTab(1);
      
      // Add to test history
      setTestHistory(prevHistory => [result, ...prevHistory].slice(0, 10));
    } catch (error) {
      console.error('Error running weather notification test:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Refresh API status
  const handleRefreshApiStatus = async () => {
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
      setApiStatus(data);
    } catch (error) {
      console.error('Error checking API status:', error);
      setApiStatus({
        weatherApi: { status: 'error', message: 'Failed to check status' },
        sendgrid: { status: 'error', message: 'Failed to check status' }
      });
    }
  };
  
  return (
    <AdminLayoutWrapper>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>Weather Notification Testing</Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Test the weather notification system with different locations, conditions, and settings.
        </Typography>
        
        <Box mb={3}>
          <ApiStatusPanel 
            apiStatus={apiStatus} 
            onRefresh={handleRefreshApiStatus} 
          />
        </Box>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Test Configuration" />
          <Tab label="Test Results" disabled={!testResults} />
          <Tab label="Test History" />
        </Tabs>
        
        {activeTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Location Selector */}
                <LocationSelector 
                  control={control} 
                  errors={errors} 
                  locationType={locationType} 
                  jobsites={jobsites} 
                />
                
                {/* Date and Time Selector */}
                <DateTimeSelector control={control} />
                
                {/* Weather Condition Overrides */}
                <WeatherConditionOverrides 
                  control={control} 
                  watch={watch} 
                  overrideConditions={overrideConditions} 
                />
                
                {/* Test Execution Options */}
                <TestExecutionOptions 
                  control={control} 
                  sendTestEmail={sendTestEmail} 
                  dryRun={dryRun} 
                />
                
                {/* Submit Button */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : dryRun ? <PlayArrowIcon /> : <SendIcon />}
                    >
                      {loading ? 'Running Test...' : dryRun ? 'Run Test (Dry Run)' : 'Run Test & Send Notifications'}
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
        )}
        
        {activeTab === 1 && testResults && (
          <Paper sx={{ p: 3 }}>
            <TestResultsView testResults={testResults} />
          </Paper>
        )}
        
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <TestHistoryList testHistory={testHistory} />
          </Paper>
        )}
      </Box>
    </AdminLayoutWrapper>
  );
};

export default WeatherTesting;
