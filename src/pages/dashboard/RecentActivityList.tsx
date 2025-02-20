// src/components/dashboard/RecentActivityList.tsx
import React from 'react';
import { Bell, Cloud, Mail, Info, Check, AlertTriangle, Clock } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { getRelativeTimeString } from '../../utils/dateUtils';

interface ActivityItem {
  id: number | string;
  type: string;
  message: string;
  timestamp: string;
  status: string;
}

interface RecentActivityListProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  loading?: boolean;
  className?: string;
}

const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  title = 'Recent Activity',
  maxItems = 5,
  showViewAll = true,
  onViewAll,
  loading = false,
  className = '',
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  
  const getActivityIcon = (type: string, status: string) => {
    switch (type) {
      case 'weather_alert':
        return <Cloud size={18} className="text-blue-500" />;
      case 'email_notification':
        return <Mail size={18} className="text-indigo-500" />;
      case 'system':
        return <Info size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
      case 'delivered':
      case 'success':
        return <Check size={16} className="text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock size={16} className="text-amber-500" />;
      default:
        return null;
    }
  };
  
  const renderSkeleton = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-start space-x-3 p-3 animate-pulse">
        <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    ));
  };
  
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} ${className}`}>
      <div className="px-5 py-4 border-b dark:border-gray-700">
        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
      
      <div className="divide-y dark:divide-gray-700">
        {loading ? (
          renderSkeleton()
        ) : displayedActivities.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No recent activity found
            </p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className={`px-5 py-3 flex items-start ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
            >
              <div className={`p-2 rounded-full mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {getActivityIcon(activity.type, activity.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  {activity.message}
                </p>
                <div className="flex items-center mt-1">
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getRelativeTimeString(activity.timestamp)}
                  </span>
                  {activity.status && (
                    <div className="flex items-center ml-2">
                      {getStatusIcon(activity.status)}
                      <span className={`ml-1 text-xs capitalize ${
                        activity.status === 'failed' || activity.status === 'error'
                          ? 'text-red-500'
                          : activity.status === 'pending' || activity.status === 'processing'
                            ? 'text-amber-500'
                            : 'text-green-500'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {showViewAll && activities.length > maxItems && (
        <div
          className={`px-5 py-3 text-center border-t ${
            darkMode
              ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          } cursor-pointer transition-colors`}
          onClick={onViewAll}
        >
          <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            View all activity
          </span>
        </div>
      )}
    </div>
  );
};

export default RecentActivityList;