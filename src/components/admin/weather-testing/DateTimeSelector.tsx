// src/components/admin/weather-testing/DateTimeSelector.tsx
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Divider, Grid, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { WeatherTestFormData } from './types';

interface DateTimeSelectorProps {
  control: Control<WeatherTestFormData>;
}

const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({ control }) => {
  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Date and Time</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Controller
          name="testDate"
          control={control}
          render={({ field }) => (
            <DateTimePicker
              label="Test Date and Time"
              value={field.value}
              onChange={(newValue) => field.onChange(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Use this to test weather forecasts for specific dates'
                }
              }}
            />
          )}
        />
      </LocalizationProvider>
    </Grid>
  );
};

export default DateTimeSelector;
