// src/components/admin/weather-testing/WeatherConditionOverrides.tsx
import React from 'react';
import { Control, Controller, UseFormWatch } from 'react-hook-form';
import { 
  Checkbox, 
  Divider, 
  FormControlLabel, 
  Grid, 
  Switch, 
  TextField, 
  Typography 
} from '@mui/material';
import { WeatherTestFormData } from './types';

interface WeatherConditionOverridesProps {
  control: Control<WeatherTestFormData>;
  watch: UseFormWatch<WeatherTestFormData>;
  overrideConditions: boolean;
}

const WeatherConditionOverrides: React.FC<WeatherConditionOverridesProps> = ({ 
  control, 
  watch, 
  overrideConditions 
}) => {
  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Weather Condition Overrides</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <FormControlLabel
        control={
          <Controller
            name="overrideConditions"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
        }
        label="Override weather conditions"
      />
      
      {overrideConditions && (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name="conditions.temperature"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Temperature"
            />
            {watch('conditions.temperature') && (
              <Controller
                name="conditions.temperatureValue"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Temperature (°F)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: 'any' }}
                  />
                )}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name="conditions.rain"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Rain"
            />
            {watch('conditions.rain') && (
              <Controller
                name="conditions.rainProbability"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Probability (%)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0, max: 100 }}
                  />
                )}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name="conditions.snow"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Snow"
            />
            {watch('conditions.snow') && (
              <Controller
                name="conditions.snowAmount"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Amount (inches)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: 'any', min: 0 }}
                  />
                )}
              />
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Controller
                  name="conditions.wind"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Wind"
            />
            {watch('conditions.wind') && (
              <Controller
                name="conditions.windSpeed"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Speed (mph)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ step: 'any', min: 0 }}
                  />
                )}
              />
            )}
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Controller
                  name="conditions.alert"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label="Weather Alert"
            />
            {watch('conditions.alert') && (
              <Controller
                name="conditions.alertType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Alert Type"
                    fullWidth
                    size="small"
                  />
                )}
              />
            )}
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default WeatherConditionOverrides;
