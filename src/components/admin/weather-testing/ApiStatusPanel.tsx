// src/components/admin/weather-testing/ApiStatusPanel.tsx
import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { 
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ApiStatus } from './types';

interface ApiStatusPanelProps {
  apiStatus: ApiStatus;
  onRefresh: () => void;
}

const ApiStatusPanel: React.FC<ApiStatusPanelProps> = ({ apiStatus, onRefresh }) => {
  // Render API status indicator
  const renderApiStatus = (api: 'weatherApi' | 'sendgrid') => {
    const status = apiStatus[api];
    
    let icon;
    let color;
    
    if (status.status === 'ok') {
      icon = <CheckCircleIcon />;
      color = 'success.main';
    } else if (status.status === 'error') {
      icon = <ErrorIcon />;
      color = 'error.main';
    } else {
      icon = <InfoIcon />;
      color = 'info.main';
    }
    
    return (
      <Box display="flex" alignItems="center" mb={1}>
        <Box color={color} mr={1}>
          {icon}
        </Box>
        <Typography variant="body2">
          {api === 'weatherApi' ? 'WeatherAPI.com' : 'SendGrid'}: {status.status === 'ok' ? 'Connected' : status.status === 'error' ? 'Error' : 'Unknown'}
          {status.message && ` - ${status.message}`}
          {status.lastChecked && ` (Last checked: ${format(new Date(status.lastChecked), 'MMM d, yyyy h:mm a')})`}
        </Typography>
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>API Status</Typography>
      {renderApiStatus('weatherApi')}
      {renderApiStatus('sendgrid')}
      <Button 
        startIcon={<RefreshIcon />} 
        variant="outlined" 
        size="small"
        onClick={onRefresh}
      >
        Refresh Status
      </Button>
    </Paper>
  );
};

export default ApiStatusPanel;
