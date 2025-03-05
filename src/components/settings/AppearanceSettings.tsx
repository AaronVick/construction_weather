// src/components/settings/AppearanceSettings.tsx
import React from 'react';
import Card from '../../components/ui/Card';
import { Save, Sun, Moon } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { SettingsProps } from './types';

interface AppearanceSettingsProps extends SettingsProps {
  toggleDarkMode: () => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  darkMode,
  formData,
  loading,
  handleInputChange,
  handleSaveAppearance,
  toggleDarkMode,
}) => {
  return (
    <Card>
      <h2 className="text-lg font-medium mb-6">Appearance Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-2">Theme</h3>
          <div className="flex space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-md flex items-center ${
                !darkMode 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Sun className="w-4 h-4 mr-2" />
              Light
            </button>
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-md flex items-center ${
                darkMode 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Moon className="w-4 h-4 mr-2" />
              Dark
            </button>
          </div>
        </div>

        <div className="pt-6 border-t dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Time Format</h3>
          <div className="space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                id="time_format"
                value="12h"
                checked={formData.time_format === '12h'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">12-hour</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                id="time_format"
                value="24h"
                checked={formData.time_format === '24h'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">24-hour</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Temperature Unit</h3>
          <div className="space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                id="temp_unit"
                value="F"
                checked={formData.temp_unit === 'F'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Fahrenheit (°F)</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                id="temp_unit"
                value="C"
                checked={formData.temp_unit === 'C'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Celsius (°C)</span>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2">Language</h3>
          <select
            id="language"
            value={formData.language}
            onChange={handleInputChange}
            className={`
              block w-full md:w-1/3 px-3 py-2 rounded-md 
              ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }
            `}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <div className="pt-6 border-t dark:border-gray-700 flex justify-end">
          <LoadingButton
            loading={loading}
            onClick={handleSaveAppearance}
            icon={Save}
            loadingText="Saving..."
          >
            Save Appearance Settings
          </LoadingButton>
        </div>
      </div>
    </Card>
  );
};

export default AppearanceSettings;
