// src/components/settings/AccountSettings.tsx
import React from 'react';
import Card from '../../components/ui/Card';
import { Save } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { SettingsProps } from './types';

const AccountSettings: React.FC<SettingsProps> = ({
  darkMode,
  formData,
  loading,
  handleInputChange,
  handleSaveProfile,
}) => {
  return (
    <Card>
      <h2 className="text-lg font-medium mb-6">Profile Information</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label 
              htmlFor="full-name" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              value={formData.full_name}
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
              htmlFor="email" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email || ''}
              disabled
              className={`
                block w-full px-3 py-2 rounded-md 
                ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }
                cursor-not-allowed
              `}
            />
            <p className="mt-1 text-xs text-gray-500">
              Contact support to change your email address
            </p>
          </div>
        </div>
        
        <div>
          <label 
            htmlFor="zip-code" 
            className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Default ZIP Code
          </label>
          <input
            id="zip-code"
            type="text"
            value={formData.zip_code}
            onChange={handleInputChange}
            placeholder="Enter ZIP code for weather forecasts"
            className={`
              block w-full md:w-1/3 px-3 py-2 rounded-md 
              ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }
            `}
          />
          <p className="mt-1 text-xs text-gray-500">
            This will be used as the default location for weather forecasts
          </p>
        </div>
        
        <div className="pt-4 flex justify-end">
          <LoadingButton
            loading={loading}
            onClick={handleSaveProfile}
            icon={Save}
            loadingText="Saving..."
          >
            Save Changes
          </LoadingButton>
        </div>
      </div>
    </Card>
  );
};

export default AccountSettings;
