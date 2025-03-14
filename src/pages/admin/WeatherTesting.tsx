// src/pages/admin/WeatherTesting.tsx
import React, { useState, useEffect } from 'react';
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
  Link,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

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

interface WorkflowStatus {
  id: string;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  repository: string;
}

interface DebugTestHistoryItem {
  id: string;
  timestamp: string;
  success: boolean;
  users_processed: number;
  successful_checks: number;
  failed_checks: number;
  notifications_sent: number;
  error: string | null;
}

interface DebugTestRunDetail extends DebugTestHistoryItem {
  results?: Array<{
    userId: string;
    success: boolean;
    triggeredConditions?: string[];
    notificationsSent?: number;
    error?: string;
  }>;
}

const WeatherTesting: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeatherTestResult | null>(null);
  
  // Debug mode states
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [workflowRunning, setWorkflowRunning] = useState<boolean>(false);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowRunId, setWorkflowRunId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Debug history states
  const [viewMode, setViewMode] = useState<'run' | 'history'>('run');
  const [historyItems, setHistoryItems] = useState<DebugTestHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<DebugTestRunDetail | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyPages, setHistoryPages] = useState<number>(1);
  
  // Initialize form
  const { register, handleSubmit, formState: { errors } } = useForm<WeatherTestFormData>({
    defaultValues: {
      zipcode: ''
    }
  });

  // Function to fetch debug test history
  const fetchDebugHistory = async (page = 1) => {
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      // Get auth token from localStorage (assuming it's stored there)
      const token = localStorage.getItem('authToken');
      
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/admin/debug-test-history?page=${page}&limit=10`;
      
      console.log('Fetching debug history from:', apiUrl);
      
      // For debugging, log the full URL
      console.log('Full URL:', apiUrl);
      console.log('Auth token available:', !!token);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // For debugging, log the response status and headers
      console.log('Response status:', response.status);
      
      // Try to get the response text first to see what's coming back
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Then parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch debug history');
      }
      console.log('Debug history data:', data);
      
      // Use the parsed data
      setHistoryItems(data.history || []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(data.page || 1);
      setHistoryPages(data.pages || 1);
    } catch (error) {
      console.error('Error fetching debug history:', error);
      setHistoryError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Function to fetch details for a specific run
  const fetchDebugRunDetails = async (runId: string) => {
    try {
      // Get auth token from localStorage (assuming it's stored there)
      const token = localStorage.getItem('authToken');
      
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/admin/debug-test-history?runId=${runId}`;
      
      console.log('Fetching debug run details from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      // For debugging, log the response status
      console.log('Response status:', response.status);
      
      // Try to get the response text first
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Then parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch debug run details');
      }
      console.log('Debug run details:', data);
      
      // Use the parsed data
      setSelectedHistoryItem(data);
    } catch (error) {
      console.error('Error fetching debug run details:', error);
      // Show error in a toast or alert
    }
  };
  
  // Effect to load history when tab changes to history
  useEffect(() => {
    if (debugMode && viewMode === 'history') {
      fetchDebugHistory(1);
    }
  }, [debugMode, viewMode]);
  
  // Effect to poll workflow status
  useEffect(() => {
    if (workflowRunId && workflowRunning) {
      const interval = setInterval(async () => {
        await checkWorkflowStatus(workflowRunId);
      }, 5000); // Poll every 5 seconds
      
      setPollingInterval(interval);
      
      // Clear interval on component unmount
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [workflowRunId, workflowRunning]);

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
  
  // Function to trigger the debug workflow
  const runDebugWorkflow = async () => {
    console.log('Triggering debug workflow');
    setWorkflowRunning(true);
    setWorkflowError(null);
    setWorkflowStatus(null);
    
    try {
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/github/trigger-workflow`;
      
      console.log('Sending request to:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow: 'test-debug-mode.yml',
          inputs: {
            debug: 'true'
          }
        })
      });
      
      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || responseData.message || 'Failed to trigger workflow');
      }
      
      setWorkflowRunId(responseData.runId);
      
      // Start checking status
      if (responseData.runId) {
        await checkWorkflowStatus(responseData.runId);
      }
      
    } catch (error) {
      console.error('Error triggering workflow:', error);
      setWorkflowError(error instanceof Error ? error.message : 'An unknown error occurred');
      setWorkflowRunning(false);
    }
  };
  
  // Function to check workflow status
  const checkWorkflowStatus = async (runId: string) => {
    try {
      // Use Vite's import.meta.env for environment variables
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const apiUrl = `${baseUrl}/api/github/workflow-status?runId=${runId}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to check workflow status');
      }
      
      const statusData: WorkflowStatus = await response.json();
      console.log('Workflow status:', statusData);
      
      setWorkflowStatus(statusData);
      
      // If workflow is complete, stop polling
      if (statusData.status === 'completed') {
        setWorkflowRunning(false);
      }
      
    } catch (error) {
      console.error('Error checking workflow status:', error);
      setWorkflowError(error instanceof Error ? error.message : 'An unknown error occurred');
      setWorkflowRunning(false);
    }
  };

  return (
    <Box mb={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Weather API Testing</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={debugMode}
              onChange={() => setDebugMode(!debugMode)}
              color="primary"
            />
          }
          label="Debug Mode"
        />
      </Box>
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
            
            {/* Debug Mode Section */}
            {debugMode && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, mt: 3 }}>
                  <Typography variant="h5" gutterBottom>Debug Mode Testing</Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Run the test-debug-mode workflow to test the weather collection system in debug mode.
                  </Typography>
                  
                  {/* Tab Navigation */}
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs 
                      value={viewMode} 
                      onChange={(e, newValue) => setViewMode(newValue)}
                      aria-label="debug mode tabs"
                    >
                      <Tab value="run" label="Run New Test" />
                      <Tab value="history" label="View History" />
                    </Tabs>
                  </Box>
                  
                  {/* Run New Test View */}
                  {viewMode === 'run' && (
                    <>
                      <Box display="flex" justifyContent="flex-start" mb={3}>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="large"
                          disabled={workflowRunning}
                          startIcon={workflowRunning ? <CircularProgress size={20} /> : null}
                          onClick={runDebugWorkflow}
                        >
                          {workflowRunning ? 'Running Workflow...' : 'Run Debug Test'}
                        </Button>
                      </Box>
                      
                      {/* Workflow Error */}
                      {workflowError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {workflowError}
                        </Alert>
                      )}
                      
                      {/* Workflow Status */}
                      {workflowStatus && (
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            Workflow Status
                          </Typography>
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body1">
                                <strong>Name:</strong> {workflowStatus.name}
                              </Typography>
                              
                              <Typography variant="body1">
                                <strong>Status:</strong> {workflowStatus.status}
                              </Typography>
                              
                              <Typography variant="body1">
                                <strong>Conclusion:</strong> {workflowStatus.conclusion || 'In progress'}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Typography variant="body1">
                                <strong>Started:</strong> {new Date(workflowStatus.created_at).toLocaleString()}
                              </Typography>
                              
                              <Typography variant="body1">
                                <strong>Last Updated:</strong> {new Date(workflowStatus.updated_at).toLocaleString()}
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                              <Box mt={1}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  component="a"
                                  href={workflowStatus.html_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                >
                                  View on GitHub
                                </Button>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      )}
                    </>
                  )}
                  
                  {/* History View */}
                  {viewMode === 'history' && (
                    <>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        View previous debug test runs and their results.
                      </Typography>
                      
                      {historyLoading ? (
                        <Box display="flex" justifyContent="center" my={4}>
                          <CircularProgress />
                        </Box>
                      ) : historyError ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {historyError}
                        </Alert>
                      ) : historyItems.length === 0 ? (
                        <Alert severity="info">No debug test history found.</Alert>
                      ) : (
                        <>
                          <TableContainer component={Paper} sx={{ mb: 2 }}>
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date/Time</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell>Users Processed</TableCell>
                                  <TableCell>Notifications</TableCell>
                                  <TableCell>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {historyItems.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>
                                      <Chip 
                                        label={item.success ? "Success" : "Failed"} 
                                        color={item.success ? "success" : "error"} 
                                        size="small" 
                                      />
                                    </TableCell>
                                    <TableCell>{item.users_processed}</TableCell>
                                    <TableCell>{item.notifications_sent}</TableCell>
                                    <TableCell>
                                      <Button 
                                        size="small" 
                                        onClick={() => fetchDebugRunDetails(item.id)}
                                      >
                                        View Details
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          {/* Pagination */}
                          {historyPages > 1 && (
                            <Box display="flex" justifyContent="center" mt={2}>
                              <Pagination 
                                count={historyPages} 
                                page={historyPage}
                                onChange={(e, page) => fetchDebugHistory(page)}
                                color="primary"
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </>
                  )}
                </Paper>
              </Grid>
            )}
            
            {/* Detail View Dialog */}
            <Dialog
              open={!!selectedHistoryItem}
              onClose={() => setSelectedHistoryItem(null)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle>
                Debug Test Run Details
                <IconButton
                  onClick={() => setSelectedHistoryItem(null)}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {selectedHistoryItem && (
                  <>
                    <Typography variant="subtitle1">
                      Run at: {new Date(selectedHistoryItem.timestamp).toLocaleString()}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      Status: 
                      <Chip 
                        label={selectedHistoryItem.success ? "Success" : "Failed"} 
                        color={selectedHistoryItem.success ? "success" : "error"} 
                        size="small" 
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    
                    {/* Display detailed results */}
                    <Typography variant="h6" sx={{ mt: 3 }}>Results</Typography>
                    <Paper sx={{ p: 2, mt: 1 }}>
                      <Typography><strong>Users Processed:</strong> {selectedHistoryItem.users_processed}</Typography>
                      <Typography><strong>Successful Checks:</strong> {selectedHistoryItem.successful_checks}</Typography>
                      <Typography><strong>Failed Checks:</strong> {selectedHistoryItem.failed_checks}</Typography>
                      <Typography><strong>Notifications:</strong> {selectedHistoryItem.notifications_sent}</Typography>
                      
                      {selectedHistoryItem.error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {selectedHistoryItem.error}
                        </Alert>
                      )}
                    </Paper>
                    
                    {/* Display user results if available */}
                    {selectedHistoryItem.results && selectedHistoryItem.results.length > 0 && (
                      <>
                        <Typography variant="h6" sx={{ mt: 3 }}>User Details</Typography>
                        {selectedHistoryItem.results.map((result, index) => (
                          <Accordion key={index} sx={{ mt: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography>
                                User {result.userId} - 
                                {result.success ? 
                                  `${result.triggeredConditions?.length || 0} conditions triggered` : 
                                  'Failed'}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {result.success ? (
                                <>
                                  <Typography><strong>Triggered Conditions:</strong> {result.triggeredConditions?.join(', ') || 'None'}</Typography>
                                  <Typography><strong>Notifications Sent:</strong> {result.notificationsSent || 0}</Typography>
                                </>
                              ) : (
                                <Alert severity="error">
                                  {result.error || 'Unknown error'}
                                </Alert>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </>
                    )}
                  </>
                )}
              </DialogContent>
            </Dialog>
            
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
