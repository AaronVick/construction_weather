// src/pages/dashboard/WeatherAutomation.tsx
import React, { useState, useEffect } from 'react';
import { Cloud, Settings, Clock, Zap, AlertTriangle, Map, Mail, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { db } from '../../lib/firebaseClient'; // Import Firebase client
import { checkWeatherForNotifications } from '../../services/weatherService'; // Import weather service
import { WeatherSettings } from '../../types/weather'; // Import WeatherSettings type
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

// Default weather settings
const defaultWeatherSettings: WeatherSettings = {
  checkTime: '05:00',
  isEnabled: true,
  alertThresholds: {
    rain: { enabled: true, thresholdPercentage: 50 },
    snow: { enabled: true, thresholdInches: 1 },
    wind: { enabled: true, thresholdMph: 25 },
    temperature: { enabled: true, thresholdFahrenheit: 32 },
    anyRain: { enabled: false, thresholdInches: 0.1 },
  },
  notificationSettings: {
    notifyClient: true,
    notifyWorkers: true,
    notificationLeadHours: 2,
    dailySummary: false,
  },
};

// Helper function to merge settings with defaults to ensure all properties exist
const mergeWithDefaults = (settings: any): WeatherSettings => {
  if (!settings) return { ...defaultWeatherSettings };
  
  return {
    checkTime: settings.checkTime || defaultWeatherSettings.checkTime,
    isEnabled: settings.isEnabled !== undefined ? settings.isEnabled : defaultWeatherSettings.isEnabled,
    alertThresholds: {
      rain: {
        enabled: settings.alertThresholds?.rain?.enabled !== undefined 
          ? settings.alertThresholds.rain.enabled 
          : defaultWeatherSettings.alertThresholds.rain.enabled,
        thresholdPercentage: settings.alertThresholds?.rain?.thresholdPercentage || 
          defaultWeatherSettings.alertThresholds.rain.thresholdPercentage
      },
      snow: {
        enabled: settings.alertThresholds?.snow?.enabled !== undefined 
          ? settings.alertThresholds.snow.enabled 
          : defaultWeatherSettings.alertThresholds.snow.enabled,
        thresholdInches: settings.alertThresholds?.snow?.thresholdInches || 
          defaultWeatherSettings.alertThresholds.snow.thresholdInches
      },
      wind: {
        enabled: settings.alertThresholds?.wind?.enabled !== undefined 
          ? settings.alertThresholds.wind.enabled 
          : defaultWeatherSettings.alertThresholds.wind.enabled,
        thresholdMph: settings.alertThresholds?.wind?.thresholdMph || 
          defaultWeatherSettings.alertThresholds.wind.thresholdMph
      },
      temperature: {
        enabled: settings.alertThresholds?.temperature?.enabled !== undefined 
          ? settings.alertThresholds.temperature.enabled 
          : defaultWeatherSettings.alertThresholds.temperature.enabled,
        thresholdFahrenheit: settings.alertThresholds?.temperature?.thresholdFahrenheit || 
          defaultWeatherSettings.alertThresholds.temperature.thresholdFahrenheit
      },
      anyRain: {
        enabled: settings.alertThresholds?.anyRain?.enabled !== undefined 
          ? settings.alertThresholds.anyRain.enabled 
          : defaultWeatherSettings.alertThresholds.anyRain.enabled,
        thresholdInches: settings.alertThresholds?.anyRain?.thresholdInches || 
          defaultWeatherSettings.alertThresholds.anyRain.thresholdInches
      },
    },
    notificationSettings: {
      notifyClient: settings.notificationSettings?.notifyClient !== undefined 
        ? settings.notificationSettings.notifyClient 
        : defaultWeatherSettings.notificationSettings.notifyClient,
      notifyWorkers: settings.notificationSettings?.notifyWorkers !== undefined 
        ? settings.notificationSettings.notifyWorkers 
        : defaultWeatherSettings.notificationSettings.notifyWorkers,
      notificationLeadHours: settings.notificationSettings?.notificationLeadHours || 
        defaultWeatherSettings.notificationSettings.notificationLeadHours,
      dailySummary: settings.notificationSettings?.dailySummary !== undefined 
        ? settings.notificationSettings.dailySummary 
        : defaultWeatherSettings.notificationSettings.dailySummary,
    },
  };
};

const WeatherAutomation: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(false);
  const [jobsiteId, setJobsiteId] = useState<string | null>(null); // State for jobsiteId
  const { user } = useFirebaseAuth();
  const [weatherSettings, setWeatherSettings] = useState<WeatherSettings>(defaultWeatherSettings);

  // Fetch the logged-in user and associated jobsiteId
  useEffect(() => {
    const fetchUserAndJobsite = async () => {
      try {
        if (!user) {
          console.error('No user logged in');
          return;
        }

        // Fetch the jobsite associated with the user
        const jobsitesQuery = query(
          collection(db, 'jobsites'),
          where('user_id', '==', user.uid)
        );

        const querySnapshot = await getDocs(jobsitesQuery);
        
        if (querySnapshot.empty) {
          console.log('No jobsites found for user');
          return;
        }

        // Get the first jobsite
        const jobsiteDoc = querySnapshot.docs[0];
        const jobsiteData = jobsiteDoc.data();
        
        setJobsiteId(jobsiteDoc.id); // Set the jobsiteId
        
        if (jobsiteData.weather_monitoring) {
          // Merge with defaults to ensure all properties exist
          const mergedSettings = mergeWithDefaults(jobsiteData.weather_monitoring);
          setWeatherSettings(mergedSettings);
          console.log('Fetched weather settings:', jobsiteData.weather_monitoring);
        }
      } catch (error) {
        console.error('Error fetching user or jobsite:', error);
      }
    };

    if (user) {
      fetchUserAndJobsite();
    }
  }, [user]);

  // Save weather settings to Firebase
  const handleSave = async () => {
    if (!jobsiteId) {
      console.error('No jobsiteId found');
      alert('No jobsite associated with this user.');
      return;
    }

    setLoading(true);
    try {
      const jobsiteRef = doc(db, 'jobsites', jobsiteId);
      await updateDoc(jobsiteRef, {
        weather_monitoring: weatherSettings
      });

      console.log('Weather settings saved successfully');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving weather settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run a manual weather check
  const handleRunWeatherCheck = async () => {
    if (!jobsiteId) {
      console.error('No jobsiteId found');
      alert('No jobsite associated with this user.');
      return;
    }

    setLoading(true);
    try {
      const result = await checkWeatherForNotifications(jobsiteId);
      console.log('Weather check result:', result);

      if (result.shouldSendNotification) {
        alert(`Weather alert triggered for: ${result.conditions.join(', ')}`);
      } else {
        alert('No weather alerts triggered.');
      }
    } catch (error) {
      console.error('Error running weather check:', error);
      alert('Failed to run weather check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Weather Automation</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Configure automatic weather monitoring and notifications
          </p>
        </div>

        <Button
          variant="primary"
          className="flex items-center"
          onClick={handleSave}
          disabled={loading}
        >
          <Save className="w-5 h-5 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-lg font-medium mb-6">Weather Monitoring Settings</h2>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Monitoring Schedule</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure when weather checks are performed
                  </p>
                </div>
                <div className="flex items-center mt-3 md:mt-0">
                  <select
                    className={`px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    value={weatherSettings.checkTime}
                    onChange={(e) =>
                      setWeatherSettings({ ...weatherSettings, checkTime: e.target.value })
                    }
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="2hours">Every 2 Hours</option>
                    <option value="3hours">Every 3 Hours</option>
                    <option value="6hours">Every 6 Hours</option>
                    <option value="12hours">Every 12 Hours</option>
                    <option value="daily">Once Daily (5 AM)</option>
                  </select>
                </div>
              </div>

              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
                <h3 className="font-medium mb-4">Alert Conditions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select weather conditions that will trigger alerts
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Heavy Rain */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="rain"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      checked={weatherSettings.alertThresholds.rain.enabled}
                      onChange={(e) =>
                        setWeatherSettings({
                          ...weatherSettings,
                          alertThresholds: {
                            ...weatherSettings.alertThresholds,
                            rain: {
                              ...weatherSettings.alertThresholds.rain,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="ml-3">
                      <label htmlFor="rain" className="font-medium text-sm">
                        Heavy Rain
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Precipitation {'>'} 0.5 in/hr
                      </p>
                    </div>
                  </div>

                  {/* Any Rain */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="any-rain"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      checked={weatherSettings.alertThresholds.anyRain.enabled}
                      onChange={(e) =>
                        setWeatherSettings({
                          ...weatherSettings,
                          alertThresholds: {
                            ...weatherSettings.alertThresholds,
                            anyRain: {
                              ...weatherSettings.alertThresholds.anyRain,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="ml-3">
                      <label htmlFor="any-rain" className="font-medium text-sm">
                        Any Rain
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Any amount of rain
                      </p>
                    </div>
                  </div>

                  {/* High Winds */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="wind"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      checked={weatherSettings.alertThresholds.wind.enabled}
                      onChange={(e) =>
                        setWeatherSettings({
                          ...weatherSettings,
                          alertThresholds: {
                            ...weatherSettings.alertThresholds,
                            wind: {
                              ...weatherSettings.alertThresholds.wind,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="ml-3">
                      <label htmlFor="wind" className="font-medium text-sm">
                        High Winds
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Wind speed {'>'} 20 mph
                      </p>
                    </div>
                  </div>

                  {/* Snow */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="snow"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      checked={weatherSettings.alertThresholds.snow.enabled}
                      onChange={(e) =>
                        setWeatherSettings({
                          ...weatherSettings,
                          alertThresholds: {
                            ...weatherSettings.alertThresholds,
                            snow: {
                              ...weatherSettings.alertThresholds.snow,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="ml-3">
                      <label htmlFor="snow" className="font-medium text-sm">
                        Snow
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Any snow accumulation
                      </p>
                    </div>
                  </div>

                  {/* Extreme Temperatures */}
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="extreme-temp"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      checked={weatherSettings.alertThresholds.temperature.enabled}
                      onChange={(e) =>
                        setWeatherSettings({
                          ...weatherSettings,
                          alertThresholds: {
                            ...weatherSettings.alertThresholds,
                            temperature: {
                              ...weatherSettings.alertThresholds.temperature,
                              enabled: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    <div className="ml-3">
                      <label htmlFor="extreme-temp" className="font-medium text-sm">
                        Extreme Temperatures
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Below 32°F or above 95°F
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
                <h3 className="font-medium mb-4">Notification Settings</h3>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Notify Clients</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Send emails to clients about weather alerts
                    </p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={weatherSettings.notificationSettings.notifyClient}
                        onChange={(e) =>
                          setWeatherSettings({
                            ...weatherSettings,
                            notificationSettings: {
                              ...weatherSettings.notificationSettings,
                              notifyClient: e.target.checked,
                            },
                          })
                        }
                      />
                      <div
                        className={`w-11 h-6 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}
                      ></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Notify Workers</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Send emails to workers about weather alerts
                    </p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={weatherSettings.notificationSettings.notifyWorkers}
                        onChange={(e) =>
                          setWeatherSettings({
                            ...weatherSettings,
                            notificationSettings: {
                              ...weatherSettings.notificationSettings,
                              notifyWorkers: e.target.checked,
                            },
                          })
                        }
                      />
                      <div
                        className={`w-11 h-6 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}
                      ></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Daily Summary</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Send a daily summary of weather conditions
                    </p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={weatherSettings.notificationSettings.dailySummary}
                        onChange={(e) =>
                          setWeatherSettings({
                            ...weatherSettings,
                            notificationSettings: {
                              ...weatherSettings.notificationSettings,
                              dailySummary: e.target.checked,
                            },
                          })
                        }
                      />
                      <div
                        className={`w-11 h-6 ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}
                      ></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div>
          <Card>
            <h2 className="text-lg font-medium mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRunWeatherCheck}
                disabled={loading}
              >
                <Zap className="w-5 h-5 mr-3 text-blue-500" />
                Run Weather Check Now
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
              >
                <Map className="w-5 h-5 mr-3 text-green-500" />
                Manage Jobsite Locations
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
              >
                <Mail className="w-5 h-5 mr-3 text-purple-500" />
                Edit Email Templates
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
              >
                <AlertTriangle className="w-5 h-5 mr-3 text-yellow-500" />
                View Recent Alerts
              </Button>
            </div>

            <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Next Scheduled Check</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Today at {weatherSettings.checkTime}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WeatherAutomation;
