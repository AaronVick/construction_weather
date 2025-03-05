// src/components/settings/SettingsSidebar.tsx
import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, LogOut } from 'lucide-react';
import Card from '../../components/ui/Card';
import { SettingsTab } from './types';

interface SettingsSidebarProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
  handleSignOut: () => Promise<void>;
  loading: boolean;
  darkMode: boolean;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeTab,
  setActiveTab,
  handleSignOut,
  loading,
  darkMode,
}) => {
  return (
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
  );
};

export default SettingsSidebar;
