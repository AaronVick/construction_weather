// src/components/settings/SecuritySettings.tsx
import React from 'react';
import Card from '../../components/ui/Card';
import { Key, Shield } from 'lucide-react';
import LoadingButton from './LoadingButton';
import { SettingsProps } from './types';
import { useToast } from '../../hooks/useToast';

const SecuritySettings: React.FC<SettingsProps> = ({
  darkMode,
  formData,
  loading,
  handleInputChange,
  handleUpdatePassword,
}) => {
  const { showToast } = useToast();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-medium mb-6">Change Password</h2>
        
        <div className="space-y-6">
          <div>
            <label 
              htmlFor="current_password" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              value={formData.current_password}
              onChange={handleInputChange}
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
              htmlFor="new_password" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              value={formData.new_password}
              onChange={handleInputChange}
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
              htmlFor="confirm_password" 
              className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleInputChange}
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
            <LoadingButton
              loading={loading}
              onClick={handleUpdatePassword}
              icon={Key}
              loadingText="Updating..."
              disabled={!formData.current_password || !formData.new_password || !formData.confirm_password}
            >
              Update Password
            </LoadingButton>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium mb-6">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <LoadingButton
          variant="outline"
          loading={false}
          onClick={() => showToast('2FA coming soon!', 'info')}
          icon={Shield}
          loadingText="Setting up..."
        >
          Set Up 2FA
        </LoadingButton>
      </Card>
    </div>
  );
};

export default SecuritySettings;
