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
import { 
  WeatherTestFormData, 
  ApiStatus, 
  JobsiteOption, 
  WeatherTestResult 
} from '../../components/admin/weather-testing/types';

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
import ApiStatusPanel from '../../components/admin/weather-testing/ApiStatusPanel';
import LocationSelector from '../../components/admin/weather-testing/LocationSelector';
import DateTimeSelector from '../../components/admin/weather-testing/DateTimeSelector';
import WeatherConditionOverrides from '../../components/admin/weather-testing/WeatherConditionOverrides';
import TestExecutionOptions from '../../components/admin/weather-testing/TestExecutionOptions';
import TestResultsView from '../../components/admin/weather-testing/TestResultsView';
import TestHistoryList from '../../components/admin/weather-testing/TestHistoryList';

const WeatherTesting: React.FC = () => {
  console.log('WeatherTesting component rendering');
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
        
        // Try to fetch from API
        try {
          const response = await fetch('/api/admin/jobsites', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setJobsites(data.jobsites);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching jobsites from API:', fetchError);
        }
        
        // If API fails, use mock data
        console.log('Using mock jobsites data');
        const mockJobsites: JobsiteOption[] = [
          {
            id: 'mock-jobsite-1',
            name: 'Downtown Office Building',
            address: '123 Main St, Washington DC',
            zipCode: '20001',
            latitude: 38.9072,
            longitude: -77.0369
          },
          {
            id: 'mock-jobsite-2',
            name: 'Riverside Apartments',
            address: '456 River Rd, Arlington VA',
            zipCode: '22209',
            latitude: 38.8977,
            longitude: -77.0365
          },
          {
            id: 'mock-jobsite-3',
            name: 'Metro Station Renovation',
            address: '789 Transit Way, Bethesda MD',
            zipCode: '20814',
            latitude: 38.9847,
            longitude: -77.0947
          }
        ];
        
        setJobsites(mockJobsites);
      } catch (error) {
        console.error('Error in jobsites fetch process:', error);
        
        // Use mock data as fallback
        const mockJobsites: JobsiteOption[] = [
          {
            id: 'mock-jobsite-1',
            name: 'Downtown Office Building',
            address: '123 Main St, Washington DC',
            zipCode: '20001',
            latitude: 38.9072,
            longitude: -77.0369
          },
          {
            id: 'mock-jobsite-2',
            name: 'Riverside Apartments',
            address: '456 River Rd, Arlington VA',
            zipCode: '22209',
            latitude: 38.8977,
            longitude: -77.0365
          }
        ];
        
        setJobsites(mockJobsites);
      }
    };
    
    fetchJobsites();
  }, [getIdToken]);
  
  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const token = await getIdToken();
        console.log('Checking API status with token:', token ? 'Token exists' : 'No token');
        
        // Try the consolidated API endpoint first
        try {
          const response = await fetch('/api/consolidated/admin/api-status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('API status from consolidated endpoint:', data);
            setApiStatus(data);
            return;
          }
        } catch (consolidatedError) {
          console.error('Error checking consolidated API status:', consolidatedError);
        }
        
        // Fall back to the direct API endpoint
        try {
          const response = await fetch('/api/admin/api-status', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('API status from direct endpoint:', data);
            setApiStatus(data);
            return;
          }
        } catch (directError) {
          console.error('Error checking direct API status:', directError);
        }
        
        // If both API calls fail, use mock data
        console.log('Using mock API status data');
        setApiStatus({
          weatherApi: { 
            status: 'ok', 
            message: 'Mock WeatherAPI (for testing UI)',
            rateLimitRemaining: 999,
            lastChecked: new Date().toISOString()
          },
          sendgrid: { 
            status: 'ok', 
            message: 'Mock SendGrid API (for testing UI)',
            lastChecked: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Error checking API status:', error);
        // Use mock data as fallback
        setApiStatus({
          weatherApi: { 
            status: 'ok', 
            message: 'Mock WeatherAPI (for testing UI)',
            rateLimitRemaining: 999,
            lastChecked: new Date().toISOString()
          },
          sendgrid: { 
            status: 'ok', 
            message: 'Mock SendGrid API (for testing UI)',
            lastChecked: new Date().toISOString()
          }
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
        
        // Try to fetch from API
        try {
          const response = await fetch('/api/admin/weather-test-history', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setTestHistory(data.history);
            return;
          }
        } catch (fetchError) {
          console.error('Error fetching test history from API:', fetchError);
        }
        
        // If API fails, use mock data
        console.log('Using mock test history data');
        const mockHistory: WeatherTestResult[] = [
          {
            timestamp: new Date().toISOString(),
            weatherData: {
              location: { name: 'Washington DC', region: 'District of Columbia', country: 'USA' },
              current: { temp_f: 45, condition: { text: 'Partly cloudy' } }
            },
            thresholds: { temperature: { min: 32, max: 100 }, wind: { max: 20 } },
            triggeredConditions: [],
            notificationPreview: {
              subject: 'Weather Alert for Your Jobsite',
              recipients: [{ email: 'test@example.com', name: 'Test User', type: 'test' }],
              templateId: 'default',
              templateData: { jobsite_name: 'Test Jobsite' }
            },
            emailSent: false,
            logs: [
              { level: 'info', message: 'Mock test history entry', timestamp: new Date().toISOString() }
            ]
          }
        ];
        
        setTestHistory(mockHistory);
      } catch (error) {
        console.error('Error in test history fetch process:', error);
        
        // Use mock data as fallback
        const mockHistory: WeatherTestResult[] = [
          {
            timestamp: new Date().toISOString(),
            weatherData: {
              location: { name: 'Washington DC', region: 'District of Columbia', country: 'USA' },
              current: { temp_f: 45, condition: { text: 'Partly cloudy' } }
            },
            thresholds: { temperature: { min: 32, max: 100 }, wind: { max: 20 } },
            triggeredConditions: [],
            notificationPreview: {
              subject: 'Weather Alert for Your Jobsite',
              recipients: [{ email: 'test@example.com', name: 'Test User', type: 'test' }],
              templateId: 'default',
              templateData: { jobsite_name: 'Test Jobsite' }
            },
            emailSent: false,
            logs: [
              { level: 'info', message: 'Mock test history entry', timestamp: new Date().toISOString() }
            ]
          }
        ];
        
        setTestHistory(mockHistory);
      }
    };
    
    fetchTestHistory();
  }, [getIdToken]);
  
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
    setLoading(true);
    setError(null);
    setWorkflowStatus(null);
    
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
      
      // Trigger the workflow
      const response = await fetch('/api/admin/trigger-weather-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger weather test workflow');
      }
      
      const result = await response.json();
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
  
  // Refresh API status
  const handleRefreshApiStatus = async () => {
    try {
      const token = await getIdToken();
      
      // Try the consolidated API endpoint first
      try {
        const response = await fetch('/api/consolidated/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
          return;
        }
      } catch (consolidatedError) {
        console.error('Error checking consolidated API status:', consolidatedError);
      }
      
      // Fall back to the direct API endpoint
      try {
        const response = await fetch('/api/admin/api-status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
          return;
        }
      } catch (directError) {
        console.error('Error checking direct API status:', directError);
      }
      
      // If both fail, use mock data
      console.log('Using mock API status data on refresh');
      setApiStatus({
        weatherApi: { 
          status: 'ok', 
          message: 'Mock WeatherAPI refreshed (for testing UI)',
          rateLimitRemaining: 999,
          lastChecked: new Date().toISOString()
        },
        sendgrid: { 
          status: 'ok', 
          message: 'Mock SendGrid API refreshed (for testing UI)',
          lastChecked: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error checking API status:', error);
      // Use mock data as fallback
      setApiStatus({
        weatherApi: { 
          status: 'ok', 
          message: 'Mock WeatherAPI refreshed (for testing UI)',
          rateLimitRemaining: 999,
          lastChecked: new Date().toISOString()
        },
        sendgrid: { 
          status: 'ok', 
          message: 'Mock SendGrid API refreshed (for testing UI)',
          lastChecked: new Date().toISOString()
        }
      });
    }
  };
  
  return (
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
        
        {activeTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <TestHistoryList testHistory={testHistory} />
          </Paper>
        )}
      </Box>
  );
};

export default WeatherTesting;
