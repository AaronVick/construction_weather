// src/components/admin/weather-testing/TestResultsView.tsx
import React from 'react';
import { 
  Box, 
  Chip, 
  Divider, 
  Grid, 
  Paper, 
  Stack, 
  Typography 
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReactJson from 'react-json-view';
import { WeatherTestResult } from './types';

interface TestResultsViewProps {
  testResults: WeatherTestResult;
}

const TestResultsView: React.FC<TestResultsViewProps> = ({ testResults }) => {
  const date = new Date(testResults.timestamp);
  const triggeredCount = testResults.triggeredConditions.length;
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          <Box ml={2}>
            <Chip 
              size="small" 
              label={`${triggeredCount} condition${triggeredCount !== 1 ? 's' : ''} triggered`}
              color={triggeredCount > 0 ? 'warning' : 'default'}
            />
            {testResults.emailSent && (
              <Chip 
                size="small" 
                label="Email sent"
                color="info"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Test run on {format(date, 'MMM d, yyyy h:mm a')}
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Weather Data</Typography>
        <Paper variant="outlined" sx={{ p: 1, maxHeight: 400, overflow: 'auto' }}>
          <ReactJson src={testResults.weatherData} collapsed={2} name={false} />
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Thresholds</Typography>
        <Paper variant="outlined" sx={{ p: 1, maxHeight: 400, overflow: 'auto' }}>
          <ReactJson src={testResults.thresholds} collapsed={1} name={false} />
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Triggered Conditions</Typography>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
          {testResults.triggeredConditions.length > 0 ? (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {testResults.triggeredConditions.map((condition, i) => (
                <Chip 
                  key={i} 
                  label={condition} 
                  color="warning" 
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No conditions triggered
            </Typography>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>Notification Preview</Typography>
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
          {testResults.notificationPreview ? (
            <>
              <Typography variant="body2">
                <strong>Subject:</strong> {testResults.notificationPreview.subject}
              </Typography>
              <Typography variant="body2">
                <strong>Recipients:</strong> {testResults.notificationPreview.recipients.length}
              </Typography>
              <Typography variant="body2">
                <strong>Template:</strong> {testResults.notificationPreview.templateId}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Template Data</Typography>
              <ReactJson 
                src={testResults.notificationPreview.templateData} 
                collapsed={1} 
                name={false} 
              />
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No notification preview available
            </Typography>
          )}
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>Logs</Typography>
        <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflow: 'auto' }}>
          {testResults.logs.map((log, i) => (
            <Box key={i} mb={1} display="flex" alignItems="flex-start">
              <Box mr={1} mt={0.5}>
                {log.level === 'error' ? (
                  <ErrorIcon fontSize="small" color="error" />
                ) : log.level === 'warning' ? (
                  <WarningIcon fontSize="small" color="warning" />
                ) : (
                  <InfoIcon fontSize="small" color="info" />
                )}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(log.timestamp), 'HH:mm:ss')}
                </Typography>
                <Typography variant="body2">
                  {log.message}
                </Typography>
                {log.data && (
                  <Box mt={0.5}>
                    <ReactJson src={log.data} collapsed={true} name={false} />
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TestResultsView;
