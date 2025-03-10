// src/components/weather/JobsiteWeatherSettings.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { JobsiteWeatherSettings as JobsiteWeatherSettingsType } from '../../types/weather';
import { Jobsite } from '../../types/jobsite';
import { 
  getJobsiteWeatherSettings, 
  saveJobsiteWeatherSettings,
  getGlobalWeatherSettings
} from '../../services/weatherNotificationService';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { 
  CloudRain, 
  Snowflake, 
  Wind, 
  Thermometer, 
  Bell, 
  Clock, 
  Users,
  AlertTriangle,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CloudLightning,
  Copy,
  Check
} from 'lucide-react';

interface JobsiteWeatherSettingsProps {
  jobsite: Jobsite;
  className?: string;
  onSave?: () => void;
}

const JobsiteWeatherSettings: React.FC<JobsiteWeatherSettingsProps> = ({ 
  jobsite,
  className,
  onSave
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const { user } = useFirebaseAuth();
  
  const [settings, setSettings] = useState<JobsiteWeatherSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    precipitation: false,
    temperature: false,
    wind: false,
    specialAlerts: false,
    timeframe: false,
    recipients: false
  });
  
  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Fetch settings
  useEffect(() => {
    async function fetchData() {
      if (!jobsite?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const settingsData = await getJobsiteWeatherSettings(jobsite.id);
        setSettings(settingsData);
      } catch (err) {
        console.error('Error fetching jobsite notification settings:', err);
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [jobsite?.id]);
  
  // Handle toggle changes
  const handleToggleChange = (path: string, value: boolean) => {
    setSettings(prev => {
      if (!prev) return prev;
      
      const newSettings = { ...prev };
      const parts = path.split('.');
      let current: any = newSettings;
      
      // Navigate to the parent object
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      
      // Update the value
      current[parts[parts.length - 1]] = value;
      
      return newSettings;
    });
  };
  
  // Handle number input changes
  const handleNumberChange = (path: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setSettings(prev => {
      if (!prev) return prev;
      
      const newSettings = { ...prev };
      const parts = path.split('.');
      let current: any = newSettings;
      
      // Navigate to the parent object
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      
      // Update the value
      current[parts[parts.length - 1]] = numValue;
      
      return newSettings;
    });
  };
  
  // Handle save
  const handleSave = async () => {
    if (!settings || !jobsite?.id) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const success = await saveJobsiteWeatherSettings(jobsite.id, settings);
      
      if (!success) {
        throw new Error('Failed to save settings');
      }
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving jobsite notification settings:', err);
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Copy global settings
  const handleCopyGlobalSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const globalSettings = await getGlobalWeatherSettings();
      
      setSettings({
        ...globalSettings,
        useGlobalDefaults: false,
        overrideGlobalSettings: true
      });
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying global settings:', err);
      setError('Failed to copy global settings');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset to global defaults
  const handleResetToGlobal = () => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      useGlobalDefaults: true,
      overrideGlobalSettings: false
    });
  };
  
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className || ''}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg ${className || ''}`}>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-800/30 rounded-md hover:bg-red-200 dark:hover:bg-red-700/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!settings) {
    return null;
  }
  
  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Weather Settings for {jobsite.name}</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={handleCopyGlobalSettings}
            className="flex items-center"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy Global Settings
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            loading={saving}
            className="flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
      
      {/* General Settings */}
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('general')}
        >
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-medium">General Settings</h3>
          </div>
          {expandedSections.general ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
        
        {expandedSections.general && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Enable Weather Notifications</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  When enabled, you'll receive notifications about weather conditions that may impact this job site.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.isEnabled}
                  onChange={(e) => handleToggleChange('isEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Use Global Settings</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    When enabled, this job site will use your global weather notification settings.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.useGlobalDefaults}
                    onChange={(e) => {
                      handleToggleChange('useGlobalDefaults', e.target.checked);
                      if (e.target.checked) {
                        handleToggleChange('overrideGlobalSettings', false);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Override Global Settings</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    When enabled, you can customize weather notification settings specifically for this job site.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.overrideGlobalSettings}
                    onChange={(e) => {
                      handleToggleChange('overrideGlobalSettings', e.target.checked);
                      if (e.target.checked) {
                        handleToggleChange('useGlobalDefaults', false);
                      }
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            {settings.overrideGlobalSettings && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize the settings below for this specific job site. These settings will override your global weather notification settings.
                </p>
              </div>
            )}
            
            {settings.useGlobalDefaults && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                <p className="text-sm">
                  This job site is using your global weather notification settings. To customize settings for this job site, enable "Override Global Settings" above.
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
      
      {/* Only show detailed settings if overriding global settings */}
      {settings.overrideGlobalSettings && (
        <>
          {/* Precipitation Settings */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('precipitation')}
            >
              <div className="flex items-center">
                <CloudRain className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-medium">Precipitation Settings</h3>
              </div>
              {expandedSections.precipitation ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
          
          {/* Temperature Settings */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('temperature')}
            >
              <div className="flex items-center">
                <Thermometer className="w-5 h-5 mr-2 text-red-500" />
                <h3 className="text-lg font-medium">Temperature Settings</h3>
              </div>
              {expandedSections.temperature ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
          
          {/* Wind Settings */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('wind')}
            >
              <div className="flex items-center">
                <Wind className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-medium">Wind Settings</h3>
              </div>
              {expandedSections.wind ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
          
          {/* Special Alerts */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('specialAlerts')}
            >
              <div className="flex items-center">
                <CloudLightning className="w-5 h-5 mr-2 text-amber-500" />
                <h3 className="text-lg font-medium">Special Weather Alerts</h3>
              </div>
              {expandedSections.specialAlerts ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
          
          {/* Forecast Timeframe */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('timeframe')}
            >
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-medium">Forecast Timeframe</h3>
              </div>
              {expandedSections.timeframe ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
          
          {/* Notification Recipients */}
          <Card>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('recipients')}
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                <h3 className="text-lg font-medium">Notification Recipients</h3>
              </div>
              {expandedSections.recipients ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </Card>
        </>
      )}
      
      <div className="flex justify-end mt-6">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default JobsiteWeatherSettings;
