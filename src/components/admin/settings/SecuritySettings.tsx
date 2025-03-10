// src/components/admin/settings/SecuritySettings.tsx
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
  FormControlLabel,
  Slider,
  Divider
} from '@mui/material';
import { Save as SaveIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';

interface SecuritySettingsFormData {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableTwoFactor: boolean;
  allowedIpAddresses: string;
}

const SecuritySettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SecuritySettingsFormData>({
    defaultValues: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      enableTwoFactor: false,
      allowedIpAddresses: ''
    }
  });
  
  // Watch form values
  const enableTwoFactor = watch('enableTwoFactor');
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Fetch security settings on component mount
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/settings/security', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch security settings');
        }
        
        const data = await response.json();
        
        // Update form values
        setValue('passwordMinLength', data.passwordMinLength || 8);
        setValue('passwordRequireUppercase', data.passwordRequireUppercase || true);
        setValue('passwordRequireLowercase', data.passwordRequireLowercase || true);
        setValue('passwordRequireNumbers', data.passwordRequireNumbers || true);
        setValue('passwordRequireSymbols', data.passwordRequireSymbols || false);
        setValue('sessionTimeout', data.sessionTimeout || 30);
        setValue('maxLoginAttempts', data.maxLoginAttempts || 5);
        setValue('enableTwoFactor', data.enableTwoFactor || false);
        setValue('allowedIpAddresses', data.allowedIpAddresses || '');
      } catch (error) {
        console.error('Error fetching security settings:', error);
        setError('Failed to fetch security settings. Using default values.');
      }
    };
    
    fetchSecuritySettings();
  }, [getIdToken, setValue]);
  
  // Handle form submission
  const onSubmit = async (data: SecuritySettingsFormData) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Send request to API
      const response = await fetch('/api/consolidated/admin/settings/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save security settings');
      }
      
      setSuccess('Security settings saved successfully');
    } catch (error) {
      console.error('Error saving security settings:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Security Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure security settings and policies for the application.
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
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Password Policy */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Password Policy" 
                subheader="Configure password requirements for all users"
                avatar={<SecurityIcon />}
              />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Password Minimum Length */}
                  <Grid item xs={12}>
                    <Typography gutterBottom>Minimum Password Length</Typography>
                    <Box sx={{ px: 2 }}>
                      <Slider
                        {...register('passwordMinLength')}
                        defaultValue={8}
                        step={1}
                        min={6}
                        max={16}
                        marks={[
                          { value: 6, label: '6' },
                          { value: 8, label: '8' },
                          { value: 12, label: '12' },
                          { value: 16, label: '16' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  </Grid>
                  
                  {/* Password Requirements */}
                  <Grid item xs={12}>
                    <Typography gutterBottom>Password Requirements</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              {...register('passwordRequireUppercase')}
                              defaultChecked
                              color="primary"
                            />
                          }
                          label="Require uppercase letters"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              {...register('passwordRequireLowercase')}
                              defaultChecked
                              color="primary"
                            />
                          }
                          label="Require lowercase letters"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              {...register('passwordRequireNumbers')}
                              defaultChecked
                              color="primary"
                            />
                          }
                          label="Require numbers"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              {...register('passwordRequireSymbols')}
                              color="primary"
                            />
                          }
                          label="Require special characters"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Session Security */}
          <Grid item xs={12}>
            <Card sx={{ mb: 3 }}>
              <CardHeader 
                title="Session Security" 
                subheader="Configure session timeout and login attempts"
              />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Session Timeout */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="session-timeout-label">Session Timeout</InputLabel>
                      <Select
                        labelId="session-timeout-label"
                        label="Session Timeout"
                        {...register('sessionTimeout')}
                        defaultValue={30}
                      >
                        <MenuItem value={15}>15 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                        <MenuItem value={60}>1 hour</MenuItem>
                        <MenuItem value={120}>2 hours</MenuItem>
                        <MenuItem value={240}>4 hours</MenuItem>
                        <MenuItem value={480}>8 hours</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Max Login Attempts */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="max-login-attempts-label">Max Login Attempts</InputLabel>
                      <Select
                        labelId="max-login-attempts-label"
                        label="Max Login Attempts"
                        {...register('maxLoginAttempts')}
                        defaultValue={5}
                      >
                        <MenuItem value={3}>3 attempts</MenuItem>
                        <MenuItem value={5}>5 attempts</MenuItem>
                        <MenuItem value={10}>10 attempts</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Advanced Security */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Advanced Security" 
                subheader="Configure two-factor authentication and IP restrictions"
              />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Two-Factor Authentication */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          {...register('enableTwoFactor')}
                          color="primary"
                        />
                      }
                      label="Enable Two-Factor Authentication for all users"
                    />
                    
                    {enableTwoFactor && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        When enabled, all users will be required to set up two-factor authentication
                        the next time they log in.
                      </Alert>
                    )}
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  
                  {/* IP Restrictions */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>IP Address Restrictions</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Restrict access to the admin area to specific IP addresses. Leave blank to allow access from any IP.
                    </Typography>
                    
                    <TextField
                      label="Allowed IP Addresses"
                      fullWidth
                      multiline
                      rows={3}
                      {...register('allowedIpAddresses')}
                      placeholder="Enter one IP address per line (e.g. 192.168.1.1)"
                      helperText="Enter one IP address or CIDR range per line (e.g. 192.168.1.1 or 192.168.1.0/24)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
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
    </Box>
  );
};

export default SecuritySettings;
