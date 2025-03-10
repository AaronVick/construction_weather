// src/components/jobsites/JobsiteForm.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Jobsite, JobsiteFormData, WeatherMonitoringSettings } from '../../types/jobsite';
import { geocodeAddress, isValidUSZipCode } from '../../services/geocodingService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { MapPin, Save, AlertCircle } from 'lucide-react';

interface JobsiteFormProps {
  initialData?: Partial<Jobsite>;
  clients?: { id: string; name: string }[];
  onSubmit: (data: Partial<Jobsite>) => Promise<void>;
  isLoading: boolean;
}

const defaultWeatherMonitoring: WeatherMonitoringSettings = {
  isEnabled: false,
  checkTime: "06:00",
  alertThresholds: {
    rain: {
      enabled: true,
      thresholdPercentage: 50
    },
    snow: {
      enabled: true,
      thresholdInches: 1
    },
    wind: {
      enabled: true,
      thresholdMph: 20
    },
    temperature: {
      enabled: true,
      thresholdFahrenheit: 32
    }
  },
  notificationSettings: {
    notifyClient: true,
    notifyWorkers: true,
    notificationLeadHours: 12
  }
};

const JobsiteForm: React.FC<JobsiteFormProps> = ({ 
  initialData = {}, 
  clients = [],
  onSubmit,
  isLoading
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  
  const [formData, setFormData] = useState<JobsiteFormData>({
    name: initialData.name || '',
    clientId: initialData.client_id || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    zipCode: initialData.zip_code || '',
    latitude: initialData.latitude,
    longitude: initialData.longitude,
    isActive: initialData.is_active !== undefined ? initialData.is_active : true,
    notes: initialData.notes || '',
    weatherMonitoring: initialData.weather_monitoring || defaultWeatherMonitoring,
    assignedWorkers: []
  });
  
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error for this field
    if (formErrors[id]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
    
    // Reset geocoding status when address fields change
    if (['address', 'city', 'state', 'zipCode'].includes(id)) {
      setGeocodingStatus('idle');
      
      // Clear coordinates if address is changing
      if (formData.latitude && formData.longitude) {
        setFormData(prev => ({
          ...prev,
          latitude: undefined,
          longitude: undefined
        }));
      }
    }
  };
  
  const handleGeocodeAddress = async () => {
    // Validate required fields
    const errors: Record<string, string> = {};
    
    if (!formData.zipCode) {
      errors.zipCode = 'ZIP code is required';
    } else if (!isValidUSZipCode(formData.zipCode)) {
      errors.zipCode = 'Please enter a valid ZIP code';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setGeocodingStatus('loading');
    
    try {
      // If we have a full address, use it for geocoding
      if (formData.address && formData.city && formData.state) {
        const result = await geocodeAddress(
          formData.address,
          formData.city,
          formData.state,
          formData.zipCode
        );
        
        if (result) {
          setFormData(prev => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude
          }));
          setGeocodingStatus('success');
        } else {
          setGeocodingStatus('error');
        }
      } else {
        // Otherwise just use the ZIP code
        const result = await geocodeAddress(
          '',
          '',
          '',
          formData.zipCode
        );
        
        if (result) {
          setFormData(prev => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude
          }));
          setGeocodingStatus('success');
        } else {
          setGeocodingStatus('error');
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setGeocodingStatus('error');
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Jobsite name is required';
    }
    
    if (!formData.clientId) {
      errors.clientId = 'Client is required';
    }
    
    if (!formData.zipCode) {
      errors.zipCode = 'ZIP code is required';
    } else if (!isValidUSZipCode(formData.zipCode)) {
      errors.zipCode = 'Please enter a valid ZIP code';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // If we don't have coordinates yet, try to geocode the address
    if (!formData.latitude || !formData.longitude) {
      await handleGeocodeAddress();
    }
    
    // Convert form data to Jobsite format
    const jobsiteData: Partial<Jobsite> = {
      name: formData.name,
      client_id: formData.clientId,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      latitude: formData.latitude,
      longitude: formData.longitude,
      is_active: formData.isActive,
      notes: formData.notes,
      weather_monitoring: formData.weatherMonitoring
    };
    
    // If this is an existing jobsite, include the ID
    if (initialData.id) {
      jobsiteData.id = initialData.id;
    }
    
    await onSubmit(jobsiteData);
  };
  
  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="name" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Jobsite Name*
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                  ${formErrors.name ? 'border-red-500' : ''}
                `}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="clientId" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Client*
              </label>
              <select
                id="clientId"
                value={formData.clientId}
                onChange={handleInputChange}
                required
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }
                  ${formErrors.clientId ? 'border-red-500' : ''}
                `}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {formErrors.clientId && (
                <p className="mt-1 text-sm text-red-500">{formErrors.clientId}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Location Information */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="address" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Street Address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
              />
            </div>
            
            <div>
              <label 
                htmlFor="city" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
              />
            </div>
            
            <div>
              <label 
                htmlFor="state" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                State
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={handleInputChange}
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                `}
              />
            </div>
            
            <div>
              <label 
                htmlFor="zipCode" 
                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                ZIP Code*
              </label>
              <input
                id="zipCode"
                type="text"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
                className={`
                  block w-full px-3 py-2 rounded-md 
                  ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }
                  ${formErrors.zipCode ? 'border-red-500' : ''}
                `}
              />
              {formErrors.zipCode && (
                <p className="mt-1 text-sm text-red-500">{formErrors.zipCode}</p>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={handleGeocodeAddress}
              disabled={geocodingStatus === 'loading' || !formData.zipCode}
              className="flex items-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Verify Address
            </Button>
            
            {geocodingStatus === 'loading' && (
              <div className="ml-4 flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                <span>Verifying address...</span>
              </div>
            )}
            
            {geocodingStatus === 'success' && (
              <div className="ml-4 text-sm text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Address verified! Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
              </div>
            )}
            
            {geocodingStatus === 'error' && (
              <div className="ml-4 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                Could not verify address. Please check the information and try again.
              </div>
            )}
          </div>
        </div>
        
        {/* Additional Information */}
        <div>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Additional Information
          </h3>
          <div>
            <label 
              htmlFor="notes" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className={`
                block w-full px-3 py-2 rounded-md 
                ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }
              `}
            />
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className={`h-4 w-4 rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <label 
              htmlFor="isActive" 
              className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Active Jobsite
            </label>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Jobsite
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default JobsiteForm;
