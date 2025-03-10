// src/components/admin/settings/GeneralSettings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Box, 
  Button, 
  CircularProgress, 
  TextField, 
  Typography, 
  Grid, 
  Alert, 
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';

interface GeneralSettingsFormData {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  defaultLanguage: string;
  defaultTimezone: string;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
}

const GeneralSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GeneralSettingsFormData | null>(null);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<GeneralSettingsFormData>({
    defaultValues: {
      siteName: 'Construction Weather',
      siteDescription: 'Weather monitoring and alerts for construction sites',
      supportEmail: 'support@constructionweather.com',
      defaultLanguage: 'en',
      defaultTimezone: 'America/New_York',
      enableMaintenanceMode: false,
      maintenanceMessage: 'The system is currently undergoing maintenance. Please check back later.'
    }
  });
  
  // Watch maintenance mode toggle
  const enableMaintenanceMode = watch('enableMaintenanceMode');
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/settings/general', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch general settings');
        }
        
        const data = await response.json();
        
        // Update form values
        setValue('siteName', data.siteName || 'Construction Weather');
        setValue('siteDescription', data.siteDescription || 'Weather monitoring and alerts for construction sites');
        setValue('supportEmail', data.supportEmail || 'support@constructionweather.com');
        setValue('defaultLanguage', data.defaultLanguage || 'en');
        setValue('defaultTimezone', data.defaultTimezone || 'America/New_York');
        setValue('enableMaintenanceMode', data.enableMaintenanceMode || false);
        setValue('maintenanceMessage', data.maintenanceMessage || 'The system is currently undergoing maintenance. Please check back later.');
        
        setSettings(data);
      } catch (error) {
        console.error('Error fetching general settings:', error);
        setError('Failed to fetch general settings. Using default values.');
      }
    };
    
    fetchSettings();
  }, [getIdToken, setValue]);
  
  // Handle form submission
  const onSubmit = async (data: GeneralSettingsFormData) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Send request to API
      const response = await fetch('/api/consolidated/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save general settings');
      }
      
      setSuccess('General settings saved successfully');
      setSettings(data);
    } catch (error) {
      console.error('Error saving general settings:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>General Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure general application settings.
      </Typography>
      
      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card>
        <CardHeader title="Site Configuration" />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Site Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Site Name"
                  fullWidth
                  {...register('siteName', { required: 'Site name is required' })}
                  error={!!errors.siteName}
                  helperText={errors.siteName?.message}
                />
              </Grid>
              
              {/* Support Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Support Email"
                  fullWidth
                  {...register('supportEmail', { 
                    required: 'Support email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={!!errors.supportEmail}
                  helperText={errors.supportEmail?.message}
                />
              </Grid>
              
              {/* Site Description */}
              <Grid item xs={12}>
                <TextField
                  label="Site Description"
                  fullWidth
                  multiline
                  rows={2}
                  {...register('siteDescription', { required: 'Site description is required' })}
                  error={!!errors.siteDescription}
                  helperText={errors.siteDescription?.message}
                />
              </Grid>
              
              {/* Default Language */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="default-language-label">Default Language</InputLabel>
                  <Select
                    labelId="default-language-label"
                    label="Default Language"
                    {...register('defaultLanguage', { required: 'Default language is required' })}
                    defaultValue="en"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Default Timezone */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="default-timezone-label">Default Timezone</InputLabel>
                  <Select
                    labelId="default-timezone-label"
                    label="Default Timezone"
                    {...register('defaultTimezone', { required: 'Default timezone is required' })}
                    defaultValue="America/New_York"
                  >
                    <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                    <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                    <MenuItem value="America/Anchorage">Alaska Time (AKT)</MenuItem>
                    <MenuItem value="Pacific/Honolulu">Hawaii Time (HT)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Maintenance Mode */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Maintenance Mode</Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        {...register('enableMaintenanceMode')}
                        color="primary"
                      />
                    }
                    label="Enable Maintenance Mode"
                  />
                  
                  <Box mt={2}>
                    <TextField
                      label="Maintenance Message"
                      fullWidth
                      multiline
                      rows={2}
                      {...register('maintenanceMessage', { 
                        required: enableMaintenanceMode ? 'Maintenance message is required when maintenance mode is enabled' : false
                      })}
                      error={!!errors.maintenanceMessage}
                      helperText={errors.maintenanceMessage?.message}
                      disabled={!enableMaintenanceMode}
                    />
                  </Box>
                </Card>
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {loading ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default GeneralSettings;
