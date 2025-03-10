// src/components/weather/WeatherNotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { WeatherSettings, NotificationRecipient } from '../../types/weather';
import { 
  getGlobalWeatherSettings, 
  saveGlobalWeatherSettings,
  getNotificationRecipients,
  previewNotifications
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
  CloudLightning
} from 'lucide-react';

interface WeatherNotificationSettingsProps {
  className?: string;
  onSave?: () => void;
}

const WeatherNotificationSettings: React.FC<WeatherNotificationSettingsProps> = ({ 
  className,
  onSave
}) => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const { user } = useFirebaseAuth();
  
  const [settings, setSettings] = useState<WeatherSettings | null>(null);
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState({
    precipitation: true,
    temperature: true,
    wind: true,
    specialAlerts: true,
    airQuality: false,
    timeframe: true,
    recipients: true
  });
  
  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Fetch settings and recipients
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [settingsData, recipientsData] = await Promise.all([
          getGlobalWeatherSettings(),
          getNotificationRecipients()
        ]);
        
        setSettings(settingsData);
        setRecipients(recipientsData);
      } catch (err) {
        console.error('Error fetching notification settings:', err);
        setError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user?.uid]);
  
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
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const success = await saveGlobalWeatherSettings(settings);
      
      if (!success) {
        throw new Error('Failed to save settings');
      }
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving notification settings:', err);
      setError('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle preview
  const handlePreview = async () => {
    if (!settings) return;
    
    try {
      setPreviewLoading(true);
      
      await previewNotifications(settings);
    } catch (err) {
      console.error('Error previewing notifications:', err);
    } finally {
      setPreviewLoading(false);
    }
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
        <h2 className="text-xl font-semibold">Weather Notification Settings</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={previewLoading}
            className="flex items-center"
          >
            <Bell className="w-4 h-4 mr-2" />
            Preview Notifications
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
      
      {/* Main toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-500" />
            <h3 className="text-lg font-medium">Enable Weather Notifications</h3>
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
        
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          When enabled, you'll receive notifications about weather conditions that may impact your job sites.
        </p>
      </Card>
      
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
        
        {expandedSections.precipitation && (
          <div className="mt-4 space-y-4">
            {/* Rain */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CloudRain className="w-4 h-4 mr-2 text-blue-500" />
                  <h4 className="font-medium">Rain</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.alertThresholds.rain.enabled}
                    onChange={(e) => handleToggleChange('alertThresholds.rain.enabled', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              {settings.alertThresholds.rain.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Probability Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.alertThresholds.rain.thresholdPercentage}
                      onChange={(e) => handleNumberChange('alertThresholds.rain.thresholdPercentage', e.target.value)}
                      className="block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount Threshold (inches)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.alertThresholds.rain.amountThreshold}
                      onChange={(e) => handleNumberChange('alertThresholds.rain.amountThreshold', e.target.value)}
                      className="block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Snow */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Snowflake className="w-4 h-4 mr-2 text-blue-300" />
                  <h4 className="font-medium">Snow</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.alertThresholds.snow.enabled}
                    onChange={(e) => handleToggleChange('alertThresholds.snow.enabled', e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}
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

export default WeatherNotificationSettings;
