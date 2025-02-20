// src/pages/dashboard/Settings.tsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Key, Lock, Mail, Shield, HelpCircle, 
         LogOut, Save, RefreshCw, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSupabase } from '../../contexts/SupabaseContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, signOut } = useSupabase();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security' | 'appearance'>('account');
  const [loading, setLoading] = useState(false);
  
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      // Redirect happens automatically via auth state change
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="md:col-span-1 p-0 overflow-hidden">
          <nav className="flex flex-col">
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'account'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <User className="w-5 h-5 mr-3" />
              Account
            </button>
            
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'notifications'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Bell className="w-5 h-5 mr-3" />
              Notifications
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'security'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Shield className="w-5 h-5 mr-3" />
              Security
            </button>
            
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center px-4 py-3 text-sm font-medium ${
                activeTab === 'appearance'
                  ? darkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-100 text-gray-900'
                  : darkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <SettingsIcon className="w-5 h-5 mr-3" />
              Appearance
            </button>
            
            <div className="border-t dark:border-gray-700 mt-auto pt-2">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign out
              </button>
            </div>
          </nav>
        </Card>
        
        {/* Main Content */}
        <div className="md:col-span-3 space-y-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <>
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
                        defaultValue={user?.user_metadata?.full_name || ''}
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
                        defaultValue={user?.email || ''}
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
                      defaultValue={user?.user_metadata?.zip_code || ''}
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
                    <Button
                      variant="primary"
                      className="flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <h2 className="text-lg font-medium mb-6">Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Temperature Unit</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Choose your preferred temperature unit
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 md:mt-0">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="temp-unit"
                          defaultChecked
                          className={`h-4 w-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        />
                        <span className="ml-2 text-sm">°F (Fahrenheit)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="temp-unit"
                          className={`h-4 w-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        />
                        <span className="ml-2 text-sm">°C (Celsius)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t dark:border-gray-700">
                    <div>
                      <h3 className="font-medium">Time Format</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Choose your preferred time format
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 md:mt-0">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="time-format"
                          defaultChecked
                          className={`h-4 w-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        />
                        <span className="ml-2 text-sm">12-hour (AM/PM)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="time-format"
                          className={`h-4 w-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        />
                        <span className="ml-2 text-sm">24-hour</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button
                      variant="primary"
                      className="flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Receive notifications via email
                    </p>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className={`w-11 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t dark:border-gray-700">
                  <h3 className="font-medium mb-4">Email Notification Types</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="notification-weather"
                        className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                        defaultChecked
                      />
                      <div className="ml-3">
                        <label htmlFor="notification-weather" className="font-medium text-sm">
                          Weather Alerts
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Notifications about significant weather changes at your jobsites
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="notification-system"
                        className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                        defaultChecked
                      />
                      <div className="ml-3">
                        <label htmlFor="notification-system" className="font-medium text-sm">
                          System Notifications
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Updates about your account, security, and system maintenance
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="notification-daily"
                        className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      />
                      <div className="ml-3">
                        <label htmlFor="notification-daily" className="font-medium text-sm">
                          Daily Summary
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Daily summary of weather conditions and notifications sent
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="notification-marketing"
                        className={`mt-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                      />
                      <div className="ml-3">
                        <label htmlFor="notification-marketing" className="font-medium text-sm">
                          Product Updates & Tips
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          New features, improvements, and best practices
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Notification Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <>
              <Card>
                <h2 className="text-lg font-medium mb-6">Change Password</h2>
                
                <div className="space-y-6">
                  <div>
                    <label 
                      htmlFor="current-password" 
                      className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Current Password
                    </label>
                    <input
                      id="current-password"
                      type="password"
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
                      htmlFor="new-password" 
                      className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className={`
                        block w-full px-3 py-2 rounded-md 
                        ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }
                      `}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters with a mix of letters, numbers & symbols
                    </p>
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="confirm-password" 
                      className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
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
                  
                  <div className="pt-4 flex justify-end">
                    <Button
                      variant="primary"
                      className="flex items-center"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>
                </div>
              </Card>
              
              <Card>
                <h2 className="text-lg font-medium mb-6">Two-Factor Authentication</h2>
                
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Enable 2FA</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <Button
                        variant="outline"
                        className="flex items-center"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Setup 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card>
                <h2 className="text-lg font-medium mb-6">Session Management</h2>
                
                <div className="space-y-6">
                  <div className="rounded-md border dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <span className="ml-2 font-medium text-sm">Current Session</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Chrome on Windows
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Washington, DC, USA
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          onClick={handleSignOut}
                        >
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-center">
                    <Button
                      variant="danger"
                      className="flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out of All Sessions
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
          
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <h2 className="text-lg font-medium mb-6">Display Settings</h2>
              
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="font-medium">Theme</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Choose between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <button
                      className={`p-3 rounded-md flex flex-col items-center ${
                        !darkMode 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-500' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-2 border-transparent'
                      }`}
                      onClick={() => toggleDarkMode && !darkMode ? null : toggleDarkMode()}
                    >
                      <Sun className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Light</span>
                    </button>
                    
                    <button
                      className={`p-3 rounded-md flex flex-col items-center ${
                        darkMode 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-2 border-blue-500' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-2 border-transparent'
                      }`}
                      onClick={() => toggleDarkMode && darkMode ? null : toggleDarkMode()}
                    >
                      <Moon className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Dark</span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-6 border-t dark:border-gray-700">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="font-medium">Language</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Select your preferred language
                      </p>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          className={`
                            block pl-10 pr-10 py-2 text-base rounded-md 
                            ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }
                          `}
                          defaultValue="en"
                        >
                          <option value="en">English (US)</option>
                          <option value="en-gb">English (UK)</option>
                          <option value="fr">Français</option>
                          <option value="es">Español</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;