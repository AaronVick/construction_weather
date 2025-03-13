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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link
} from '@mui/material';
import { 
  PlayArrow as PlayArrowIcon,
  Send as SendIcon
} from '@mui/icons-material';
// No need to import AdminLayoutWrapper as it's handled by the route structure
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

// Import types
import { WeatherTestFormData } from '../../components/admin/weather-testing/types';

// Add new types for workflow status
interface WorkflowJob {
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface WorkflowStatus {
  status: string;
  conclusion: string | null;
  jobs: WorkflowJob[];
  logsUrl: string;
  htmlUrl: string;
}

// Import components
import LocationSelector from '../../components/admin/weather-testing/LocationSelector';
import DateTimeSelector from '../../components/admin/weather-testing/DateTimeSelector';
import WeatherConditionOverrides from '../../components/admin/weather-testing/WeatherConditionOverrides';
import TestExecutionOptions from '../../components/admin/weather-testing/TestExecutionOptions';

const WeatherTesting: React.FC = () => {
  console.log('WeatherTesting component rendering');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [workflowCheckInterval, setWorkflowCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
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

  // Function to check workflow status
  const checkWorkflowStatus = async (runId: string) => {
    try {
      const token = await getIdToken();
      const response = await fetch(`/api/admin/workflow-status?runId=${runId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const status = await response.json();
        setWorkflowStatus(status);

        // If workflow is completed or failed, clear the interval
        if (status.status === 'completed') {
          if (workflowCheckInterval) {
            clearInterval(workflowCheckInterval);
            setWorkflowCheckInterval(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking workflow status:', error);
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (workflowCheckInterval) {
        clearInterval(workflowCheckInterval);
      }
    };
  }, [workflowCheckInterval]);

  // Handle form submission
  const onSubmit = async (data: WeatherTestFormData) => {
    console.log('Form submitted with data:', data);
    setLoading(true);
    setError(null);
    setWorkflowStatus(null);
    
    try {
      const token = await getIdToken();
      console.log('Got auth token');
      
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
      
      console.log('Sending request to API with body:', requestBody);
      
      // Trigger the workflow
      const response = await fetch('/api/admin/trigger-weather-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || 'Failed to trigger weather test workflow');
      }
      
      const result = await response.json();
      console.log('API success response:', result);
      
      setWorkflowRunId(result.workflowRunId);
      
      // Start checking workflow status
      const interval = setInterval(() => checkWorkflowStatus(result.workflowRunId), 5000);
      setWorkflowCheckInterval(interval);
      
      // Switch to results tab
      setActiveTab(1);
      
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
  
  return (
    <Box mb={4}>
      <Typography variant="h4" gutterBottom>Weather API Testing</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test the weather API functionality with different locations and conditions.
      </Typography>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Test Configuration" />
        <Tab label="Test Results" disabled={!workflowStatus} />
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
      
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          {workflowStatus ? (
            <Box>
              <Typography variant="h6" gutterBottom>Workflow Status</Typography>
              <Box mb={2}>
                <Typography variant="body1">
                  Status: {workflowStatus.status}
                  {workflowStatus.conclusion && ` (${workflowStatus.conclusion})`}
                </Typography>
                {workflowStatus.htmlUrl && (
                  <Link href={workflowStatus.htmlUrl} target="_blank" rel="noopener noreferrer">
                    View on GitHub
                  </Link>
                )}
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>Jobs</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workflowStatus.jobs.map((job) => (
                      <TableRow key={job.name}>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>
                          {job.status}
                          {job.conclusion && ` (${job.conclusion})`}
                        </TableCell>
                        <TableCell>{job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}</TableCell>
                        <TableCell>{job.completedAt ? new Date(job.completedAt).toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default WeatherTesting;
