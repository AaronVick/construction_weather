// src/components/settings/NotificationSettings.tsx
import React from 'react';
import Card from '../../components/ui/Card';
import { Save } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { SettingsProps } from './types';

const NotificationSettings: React.FC<SettingsProps> = ({
  darkMode,
  formData,
  loading,
  handleInputChange,
  handleSaveNotifications,
}) => {
  return (
    <Card>
      <h2 className="text-lg font-medium mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notification_email"
                type="checkbox"
                checked={formData.notification_email}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="notification_email" className="font-medium text-sm">
                Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive weather alerts and important updates via email
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notification_summary"
                type="checkbox"
                checked={formData.notification_summary}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="notification_summary" className="font-medium text-sm">
                Daily Summary
              </label>
              <p className="text-sm text-gray-500">
                Get a daily summary of weather conditions and upcoming alerts
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notification_marketing"
                type="checkbox"
                checked={formData.notification_marketing}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="notification_marketing" className="font-medium text-sm">
                Marketing Updates
              </label>
              <p className="text-sm text-gray-500">
                Receive updates about new features and promotional offers
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t dark:border-gray-700">
          <LoadingButton
            loading={loading}
            onClick={handleSaveNotifications}
            icon={Save}
            loadingText="Saving..."
          >
            Save Notification Settings
          </LoadingButton>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
