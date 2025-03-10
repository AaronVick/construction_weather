// src/components/admin/settings/BillingSettings.tsx
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import { Save as SaveIcon, Add as AddIcon } from '@mui/icons-material';
import { useFirebaseAuth } from '../../../hooks/useFirebaseAuth';

interface PlanData {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
}

interface BillingSettingsFormData {
  stripePublicKey: string;
  stripeSecretKey: string;
  currency: string;
  taxRate: number;
  enableTrialPeriod: boolean;
  trialDays: number;
}

const BillingSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [stripeConnected, setStripeConnected] = useState<boolean>(false);
  
  // Get auth context
  const { user } = useFirebaseAuth();
  
  // Initialize form
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BillingSettingsFormData>({
    defaultValues: {
      stripePublicKey: '',
      stripeSecretKey: '',
      currency: 'USD',
      taxRate: 0,
      enableTrialPeriod: true,
      trialDays: 14
    }
  });
  
  // Watch trial period toggle
  const enableTrialPeriod = watch('enableTrialPeriod');
  
  // Function to get ID token
  const getIdToken = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    return await user.getIdToken();
  };
  
  // Fetch billing settings and plans on component mount
  useEffect(() => {
    const fetchBillingSettings = async () => {
      try {
        const token = await getIdToken();
        const response = await fetch('/api/consolidated/admin/settings/billing', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch billing settings');
        }
        
        const data = await response.json();
        
        // Update form values
        setValue('stripePublicKey', data.stripePublicKey || '');
        setValue('stripeSecretKey', data.stripeSecretKey ? '••••••••••••••••••••••••••' : '');
        setValue('currency', data.currency || 'USD');
        setValue('taxRate', data.taxRate || 0);
        setValue('enableTrialPeriod', data.enableTrialPeriod || true);
        setValue('trialDays', data.trialDays || 14);
        
        // Set Stripe connection status
        setStripeConnected(!!data.stripeConnected);
        
        // Set plans
        if (data.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
        }
      } catch (error) {
        console.error('Error fetching billing settings:', error);
        setError('Failed to fetch billing settings. Using default values.');
      }
    };
    
    fetchBillingSettings();
  }, [getIdToken, setValue]);
  
  // Handle form submission
  const onSubmit = async (data: BillingSettingsFormData) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    
    try {
      const token = await getIdToken();
      
      // Don't send masked secret key if it hasn't changed
      const formData = {
        ...data,
        stripeSecretKey: data.stripeSecretKey.includes('•') ? undefined : data.stripeSecretKey
      };
      
      // Send request to API
      const response = await fetch('/api/consolidated/admin/settings/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save billing settings');
      }
      
      const responseData = await response.json();
      
      // Update Stripe connection status
      setStripeConnected(!!responseData.stripeConnected);
      
      setSuccess('Billing settings saved successfully');
    } catch (error) {
      console.error('Error saving billing settings:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Billing & Subscription Settings</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure payment processing and subscription plans.
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
      
      {/* Stripe Configuration */}
      <Card sx={{ mb: 4 }}>
        <CardHeader 
          title="Stripe Configuration" 
          subheader="Connect your Stripe account for payment processing"
        />
        <CardContent>
          <Alert 
            severity={stripeConnected ? 'success' : 'info'}
            sx={{ mb: 3 }}
          >
            {stripeConnected 
              ? 'Stripe is connected and ready to process payments.' 
              : 'Stripe is not connected. Please enter your API keys to enable payment processing.'}
          </Alert>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              {/* Stripe Public Key */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Stripe Public Key"
                  fullWidth
                  {...register('stripePublicKey', { required: 'Stripe public key is required' })}
                  error={!!errors.stripePublicKey}
                  helperText={errors.stripePublicKey?.message}
                />
              </Grid>
              
              {/* Stripe Secret Key */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Stripe Secret Key"
                  fullWidth
                  type="password"
                  {...register('stripeSecretKey', { required: 'Stripe secret key is required' })}
                  error={!!errors.stripeSecretKey}
                  helperText={errors.stripeSecretKey?.message}
                />
              </Grid>
              
              {/* Currency */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="currency-label">Currency</InputLabel>
                  <Select
                    labelId="currency-label"
                    label="Currency"
                    {...register('currency', { required: 'Currency is required' })}
                    defaultValue="USD"
                  >
                    <MenuItem value="USD">USD - US Dollar</MenuItem>
                    <MenuItem value="EUR">EUR - Euro</MenuItem>
                    <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                    <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Tax Rate */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tax Rate (%)"
                  fullWidth
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  {...register('taxRate', { 
                    required: 'Tax rate is required',
                    min: { value: 0, message: 'Tax rate must be at least 0%' },
                    max: { value: 100, message: 'Tax rate cannot exceed 100%' }
                  })}
                  error={!!errors.taxRate}
                  helperText={errors.taxRate?.message}
                />
              </Grid>
              
              {/* Trial Period */}
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Trial Period</Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item>
                      <FormControl>
                        <InputLabel id="enable-trial-label">Enable Trial</InputLabel>
                        <Select
                          labelId="enable-trial-label"
                          label="Enable Trial"
                          {...register('enableTrialPeriod')}
                          defaultValue={true}
                        >
                          <MenuItem value="true">Yes</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs>
                      <TextField
                        label="Trial Period (Days)"
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 90, step: 1 }}
                        {...register('trialDays', { 
                          required: enableTrialPeriod ? 'Trial days is required when trial is enabled' : false,
                          min: { value: 1, message: 'Trial period must be at least 1 day' },
                          max: { value: 90, message: 'Trial period cannot exceed 90 days' }
                        })}
                        error={!!errors.trialDays}
                        helperText={errors.trialDays?.message}
                        disabled={!enableTrialPeriod}
                      />
                    </Grid>
                  </Grid>
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
      
      {/* Subscription Plans */}
      <Card>
        <CardHeader 
          title="Subscription Plans" 
          subheader="Manage available subscription plans"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {/* Open plan creation modal */}}
            >
              Add Plan
            </Button>
          }
        />
        <CardContent>
          {plans.length === 0 ? (
            <Alert severity="info">
              No subscription plans have been created yet. Click "Add Plan" to create your first plan.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Billing Cycle</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <Typography variant="subtitle2">{plan.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {plan.description}
                        </Typography>
                      </TableCell>
                      <TableCell>${plan.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {plan.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={plan.isActive ? 'Active' : 'Inactive'} 
                          color={plan.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" color="primary">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BillingSettings;
