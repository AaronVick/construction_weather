// src/pages/dashboard/EmailConfiguration.tsx
import React, { useState } from 'react';
import { Mail, Settings, Edit2, Copy, Send, Trash, Plus, FileText, Save } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const EmailConfiguration: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Email Configuration</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            Configure email settings and templates for notifications
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
      
      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            className={`py-4 font-medium text-sm border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Email Settings
          </button>
          <button
            className={`py-4 font-medium text-sm border-b-2 ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('templates')}
          >
            Email Templates
          </button>
        </nav>
      </div>
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-medium mb-6">Sender Configuration</h2>
            
            <div className="space-y-6">
              <div>
                <label 
                  htmlFor="sender-name" 
                  className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Sender Name
                </label>
                <input
                  id="sender-name"
                  type="text"
                  placeholder="Your Company Name"
                  defaultValue="Weather Crew Notifications"
                  className={`
                    block w-full px-3 py-2 rounded-md 
                    ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This name will appear in the "From" field of emails
                </p>
              </div>
              
              <div>
                <label 
                  htmlFor="sender-email" 
                  className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Sender Email
                </label>
                <input
                  id="sender-email"
                  type="email"
                  placeholder="notifications@yourcompany.com"
                  defaultValue="notifications@weathercrew.app"
                  className={`
                    block w-full px-3 py-2 rounded-md 
                    ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  This email will be used as the reply-to address
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-lg font-medium mb-6">Email Enhancement</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Use AI Enhancement</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Improve email readability with AI
                  </p>
                </div>
                <div className="flex items-center mt-2 md:mt-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className={`w-11 h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600`}></div>
                  </label>
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="email-tone" 
                  className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Email Tone
                </label>
                <select
                  id="email-tone"
                  className={`
                    block w-full px-3 py-2 rounded-md 
                    ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }
                  `}
                  defaultValue="professional"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="urgent">Urgent</option>
                </select>
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select the tone for all automated emails
                </p>
              </div>
              
              <div>
                <label 
                  htmlFor="additional-instructions" 
                  className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Additional Instructions
                </label>
                <textarea
                  id="additional-instructions"
                  rows={4}
                  placeholder="Any specific instructions for email enhancement"
                  defaultValue="Keep emails concise. Include company logo in signature. Use appropriate greetings based on time of day."
                  className={`
                    block w-full px-3 py-2 rounded-md 
                    ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }
                  `}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Provide any specific instructions for AI email enhancement
                </p>
              </div>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-lg font-medium mb-6">Notification Settings</h2>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Include Weather Details</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add detailed weather information in emails
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
                  <h3 className="font-medium mb-1">Send Test Email on Save</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive a test email when settings are saved
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
          </Card>
        </div>
      )}
      
      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Email Templates</h2>
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
          
          <Card>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Weather Alert - Standard</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Default template for weather alerts
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Weather Alert - Urgent</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      For severe weather conditions
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-3">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Daily Weather Summary</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Daily weather report template
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-lg font-medium mb-6">Template Variables</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Use these variables in your email templates to include dynamic content:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{client_name}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The client's full name
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{jobsite_name}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Name of the jobsite
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{weather_condition}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current weather condition
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{temperature}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current temperature
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{date}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Current date
                </p>
              </div>
              
              <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <code className="text-sm">{'{company_name}'}</code>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your company name
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmailConfiguration;