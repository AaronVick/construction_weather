// src/components/admin/weather-testing/LocationSelector.tsx
import React from 'react';
import { Control, Controller, FieldErrors } from 'react-hook-form';
import { 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  FormHelperText,
  Typography,
  Divider
} from '@mui/material';
import { WeatherTestFormData } from './types';

interface LocationSelectorProps {
  control: Control<WeatherTestFormData>;
  errors: FieldErrors<WeatherTestFormData>;
  locationType: 'zipcode' | 'address' | 'coordinates';
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  control,
  errors,
  locationType
}) => {
  return (
    <Grid item xs={12}>
      <Typography variant="h6" gutterBottom>Location</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.locationType}>
        <InputLabel>Location Type</InputLabel>
        <Controller
          name="locationType"
          control={control}
          render={({ field }) => (
            <Select {...field} label="Location Type">
              <MenuItem value="zipcode">Zip Code</MenuItem>
              <MenuItem value="address">Address</MenuItem>
              <MenuItem value="coordinates">Coordinates</MenuItem>
            </Select>
          )}
        />
        {errors.locationType && (
          <FormHelperText>{errors.locationType.message}</FormHelperText>
        )}
      </FormControl>
      
      {locationType === 'zipcode' && (
        <Controller
          name="zipcode"
          control={control}
          rules={{ required: 'Zip code is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Zip Code"
              fullWidth
              error={!!errors.zipcode}
              helperText={errors.zipcode?.message}
            />
          )}
        />
      )}
      
      {locationType === 'address' && (
        <Controller
          name="address"
          control={control}
          rules={{ required: 'Address is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Address"
              fullWidth
              error={!!errors.address}
              helperText={errors.address?.message}
            />
          )}
        />
      )}
      
      {locationType === 'coordinates' && (
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Controller
              name="latitude"
              control={control}
              rules={{ 
                required: 'Latitude is required',
                min: { value: -90, message: 'Minimum latitude is -90' },
                max: { value: 90, message: 'Maximum latitude is 90' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Latitude"
                  type="number"
                  fullWidth
                  error={!!errors.latitude}
                  helperText={errors.latitude?.message}
                  inputProps={{ step: 'any' }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="longitude"
              control={control}
              rules={{ 
                required: 'Longitude is required',
                min: { value: -180, message: 'Minimum longitude is -180' },
                max: { value: 180, message: 'Maximum longitude is 180' }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Longitude"
                  type="number"
                  fullWidth
                  error={!!errors.longitude}
                  helperText={errors.longitude?.message}
                  inputProps={{ step: 'any' }}
                />
              )}
            />
          </Grid>
        </Grid>
      )}
    </Grid>
  );
};

export default LocationSelector;
