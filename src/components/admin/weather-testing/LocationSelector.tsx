// src/components/admin/weather-testing/LocationSelector.tsx
import React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField, 
  FormHelperText 
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
      <FormControl fullWidth error={!!errors.locationType}>
        <InputLabel>Location Type</InputLabel>
        <Select
          label="Location Type"
          defaultValue="zipcode"
          {...control.register('locationType')}
        >
          <MenuItem value="zipcode">Zip Code</MenuItem>
          <MenuItem value="address">Address</MenuItem>
          <MenuItem value="coordinates">Coordinates</MenuItem>
        </Select>
        {errors.locationType && (
          <FormHelperText>{errors.locationType.message}</FormHelperText>
        )}
      </FormControl>
    </Grid>
  );
};

export default LocationSelector;
