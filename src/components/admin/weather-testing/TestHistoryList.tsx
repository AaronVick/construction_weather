// src/components/admin/weather-testing/TestHistoryList.tsx
import React from 'react';
import { 
  Accordion, 
  AccordionDetails, 
  AccordionSummary, 
  Box, 
  Chip, 
  Divider, 
  Grid, 
  Paper, 
  Stack, 
  Typography 
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReactJson from 'react-json-view';
import { WeatherTestResult } from './types';

interface TestHistoryListProps {
  testHistory: WeatherTestResult[];
}

const TestHistoryList: React.FC<TestHistoryListProps> = ({ testHistory }) => {
  // Render test history item
  const renderTestHistoryItem = (test: WeatherTestResult, index: number) => {
    const date = new Date(test.timestamp);
    const triggeredCount = test.triggeredConditions.length;
    
    return (
      <Accordion key={index}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            Test on {format(date, 'MMM d, yyyy h:mm a')}
            {' '}
            <Chip 
              size="small" 
              label={`${triggeredCount} condition${triggeredCount !== 1 ? 's' : ''} triggered`}
              color={triggeredCount > 0 ? 'warning' : 'default'}
              sx={{ ml: 1 }}
            />
            {test.emailSent && (
              <Chip 
                size="small" 
                label="Email sent"
                color="info"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Weather Data</Typography>
              <Paper variant="outlined" sx={{ p: 1, maxHeight: 300, overflow: 'auto' }}>
                <ReactJson src={test.weatherData} collapsed={2} name={false} />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Triggered Conditions</Typography>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                {test.triggeredConditions.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {test.triggeredConditions.map((condition, i) => (
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
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>Notification Preview</Typography>
                {test.notificationPreview ? (
                  <>
                    <Typography variant="body2">
                      <strong>Subject:</strong> {test.notificationPreview.subject}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Recipients:</strong> {test.notificationPreview.recipients.length}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Template:</strong> {test.notificationPreview.templateId}
                    </Typography>
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
                {test.logs.map((log, i) => (
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
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Test History</Typography>
      {testHistory.length > 0 ? (
        testHistory.map((test, index) => renderTestHistoryItem(test, index))
      ) : (
        <Typography variant="body2" color="text.secondary">
          No test history available
        </Typography>
      )}
    </Box>
  );
};

export default TestHistoryList;
