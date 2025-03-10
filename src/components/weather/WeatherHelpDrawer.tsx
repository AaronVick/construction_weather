// src/components/weather/WeatherHelpDrawer.tsx
import React from 'react';
import { X, ExternalLink, AlertTriangle, CloudRain, Snowflake, Wind, Thermometer } from 'lucide-react';

interface WeatherHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
}

const WeatherHelpDrawer: React.FC<WeatherHelpDrawerProps> = ({ isOpen, onClose, isPro }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Weather Settings Help</h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close help"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Introduction */}
              <section>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <CloudRain className="w-5 h-5 mr-2 text-blue-500" />
                  Weather Notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Weather notifications help you stay informed about conditions that might affect your job sites. 
                  {isPro ? ' As a premium user, you can configure settings for each job site individually.' : ' Configure your settings below to receive alerts when conditions might impact your work.'}
                </p>
              </section>
              
              {/* Notification Types */}
              <section>
                <h3 className="text-lg font-medium mb-2">Notification Types</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-start">
                      <CloudRain className="w-5 h-5 mr-2 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Rain Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Get notified when there's a high probability of rain that might affect outdoor work. 
                          You can set the threshold for the percentage chance of rain that triggers an alert.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-start">
                      <Snowflake className="w-5 h-5 mr-2 text-indigo-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Snow Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Receive notifications when snow is expected. You can set the threshold for the amount of 
                          snow (in inches) that triggers an alert.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start">
                      <Wind className="w-5 h-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Wind Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Get alerts when wind speeds exceed your specified threshold (in mph). High winds can 
                          affect crane operations, scaffolding, and other construction activities.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-start">
                      <Thermometer className="w-5 h-5 mr-2 text-amber-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Temperature Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Receive notifications when temperatures fall below your specified threshold (in °F). 
                          Cold temperatures can affect concrete curing, worker safety, and equipment operation.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {isPro && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Severe Weather Alerts</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Premium feature: Get immediate notifications for severe weather warnings from 
                            official weather services, including thunderstorms, tornadoes, and other extreme conditions.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
              
              {/* Configuration Tips */}
              <section>
                <h3 className="text-lg font-medium mb-2">Configuration Tips</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                  <li>
                    <strong>Check Time:</strong> Set when you want the system to check weather conditions. 
                    For construction, early morning (e.g., 6:00 AM) is recommended to plan your day.
                  </li>
                  <li>
                    <strong>Check Days:</strong> Select which days of the week to check weather conditions. 
                    Typically, this should match your work schedule.
                  </li>
                  <li>
                    <strong>Thresholds:</strong> Set appropriate thresholds based on your specific work requirements. 
                    For example, light rain might not affect some indoor work, but could impact exterior painting.
                  </li>
                  {isPro && (
                    <>
                      <li>
                        <strong>Jobsite-Specific Settings:</strong> Configure different settings for each jobsite 
                        based on the type of work being performed and local weather patterns.
                      </li>
                      <li>
                        <strong>Working Hours:</strong> Define working hours to receive more targeted forecasts 
                        for the times when your crew is actually on site.
                      </li>
                    </>
                  )}
                </ul>
              </section>
              
              {/* Recommended Settings */}
              <section>
                <h3 className="text-lg font-medium mb-2">Recommended Settings</h3>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">General Construction</h4>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                    <li>Rain: 50% chance or higher</li>
                    <li>Snow: 1 inch or more</li>
                    <li>Wind: 20 mph or higher</li>
                    <li>Temperature: Below 32°F</li>
                    <li>Check Time: 6:00 AM</li>
                    <li>Check Days: Monday through Friday</li>
                  </ul>
                </div>
                
                {isPro && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Concrete Work</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                        <li>Rain: 30% chance or higher</li>
                        <li>Snow: Any amount</li>
                        <li>Wind: 15 mph or higher</li>
                        <li>Temperature: Below 40°F or above 90°F</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Roofing</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                        <li>Rain: 20% chance or higher</li>
                        <li>Snow: Any amount</li>
                        <li>Wind: 12 mph or higher</li>
                        <li>Temperature: Below 40°F</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Painting (Exterior)</h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                        <li>Rain: 10% chance or higher</li>
                        <li>Snow: Any amount</li>
                        <li>Wind: 10 mph or higher</li>
                        <li>Temperature: Below 50°F or above 85°F</li>
                        <li>Humidity: Above 85%</li>
                      </ul>
                    </div>
                  </div>
                )}
              </section>
              
              {/* Additional Resources */}
              <section>
                <h3 className="text-lg font-medium mb-2">Additional Resources</h3>
                <div className="space-y-2">
                  <a 
                    href="https://www.weather.gov/safety/flood-during" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    NOAA: Flood Safety
                  </a>
                  <a 
                    href="https://www.osha.gov/winter-weather" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    OSHA: Winter Weather Safety
                  </a>
                  <a 
                    href="https://www.osha.gov/heat-exposure" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    OSHA: Heat Safety
                  </a>
                </div>
              </section>
              
              {/* Premium Features (only shown to basic users) */}
              {!isPro && (
                <section className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-2 text-indigo-600 dark:text-indigo-400">
                    Premium Features
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Upgrade to our Premium or Enterprise plan to access these additional features:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Jobsite-specific weather settings</li>
                    <li>Severe weather alerts from official weather services</li>
                    <li>More precise location-based forecasts using GPS coordinates</li>
                    <li>Hourly forecasts for better planning</li>
                    <li>Working hours configuration for targeted forecasts</li>
                    <li>Advanced notification options including SMS and phone calls</li>
                  </ul>
                  <div className="mt-4">
                    <button 
                      onClick={() => window.location.href = '/subscription'}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherHelpDrawer;
