// src/components/admin/weather-testing/TestExecutionOptions.tsx
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { 
  Box, 
  Divider, 
  FormControlLabel, 
  FormGroup, 
  Grid, 
  Switch, 
  TextField, 
  Typography 
} from '@mui/material';
import { WeatherTestFormData } from './types';

interface TestExecutionOptionsProps {
  control: Control<WeatherTestFormData>;
  sendTestEmail: boolean;
  dryRun: boolean;
}

const TestExecutionOptions: React.FC<TestExecutionOptionsProps> = ({ 
  control, 
  sendTestEmail, 
  dryRun 
}) => {
  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Test Execution Options</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <FormGroup>
        <FormControlLabel
          control={
            <Controller
              name="dryRun"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                />
              )}
            />
          }
          label="Dry run (simulate without sending actual notifications)"
        />
        
        <FormControlLabel
          control={
            <Controller
              name="sendTestEmail"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                />
              )}
            />
          }
          label="Send test email"
        />
        
        {sendTestEmail && (
          <Box mt={2}>
            <Controller
              name="testEmailRecipients"
              control={control}
              rules={{ 
                required: sendTestEmail ? 'Email recipients are required' : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address format'
                }
              }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Test Email Recipients"
                  fullWidth
                  multiline
                  rows={2}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message || 'Separate multiple email addresses with commas'}
                />
              )}
            />
          </Box>
        )}
      </FormGroup>
    </Grid>
  );
};

export default TestExecutionOptions;
