// src/pages/dashboard/WeatherAutomation.tsx
import React, { useState } from 'react';
import { Cloud, Settings, Clock, Zap, AlertTriangle, Map, Mail, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const WeatherAutomation: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  
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
          onClick={() => {}}
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
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="rain"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      defaultChecked
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
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="wind"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      defaultChecked
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
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="snow"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      defaultChecked
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
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="lightning"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      defaultChecked
                    />
                    <div className="ml-3">
                      <label htmlFor="lightning" className="font-medium text-sm">
                        Lightning
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Any thunderstorm activity
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="extreme-temp"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
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
                  
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="air-quality"
                      className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                    />
                    <div className="ml-3">
                      <label htmlFor="air-quality" className="font-medium text-sm">
                        Poor Air Quality
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        AQI {'>'} 150
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
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className={`w-11 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
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
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className={`w-11 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
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
                      <input type="checkbox" className="sr-only peer" />
                      <div className={`w-11 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card>
            <h2 className="text-lg font-medium mb-6">Quick Actions</h2>
            
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {}}
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
                    Today at 5:00 PM
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