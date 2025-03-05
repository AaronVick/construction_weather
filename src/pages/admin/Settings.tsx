// src/pages/admin/Settings.tsx
import React, { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

const AdminSettings: React.FC = () => {
  const { isLoading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'email' | 'security' | 'admins'>('general');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  if (adminLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`${
              activeTab === 'billing'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Billing & Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`${
              activeTab === 'email'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Email
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`${
              activeTab === 'security'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`${
              activeTab === 'admins'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Admin Users
          </button>
        </nav>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'general' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">General Settings</h2>
            <p className="text-gray-500">Configure general application settings here.</p>
          </div>
        )}
        
        {activeTab === 'billing' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing & Subscriptions</h2>
            <p className="text-gray-500">Configure billing and subscription settings here.</p>
          </div>
        )}
        
        {activeTab === 'email' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Email Settings</h2>
            <p className="text-gray-500">Configure email settings and templates here.</p>
          </div>
        )}
        
        {activeTab === 'security' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
            <p className="text-gray-500">Configure security settings and permissions here.</p>
          </div>
        )}
        
        {activeTab === 'admins' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Users</h2>
            <p className="text-gray-500">Manage admin users and permissions here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
