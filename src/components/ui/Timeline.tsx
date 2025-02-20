// src/components/ui/Timeline.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'info' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  
  const getStatusColor = (status?: TimelineItem['status']) => {
    switch (status) {
      case 'success':
        return darkMode ? 'bg-green-500 border-green-500' : 'bg-green-500 border-green-500';
      case 'warning':
        return darkMode ? 'bg-amber-500 border-amber-500' : 'bg-amber-500 border-amber-500';
      case 'error':
        return darkMode ? 'bg-red-500 border-red-500' : 'bg-red-500 border-red-500';
      case 'info':
        return darkMode ? 'bg-blue-500 border-blue-500' : 'bg-blue-500 border-blue-500';
      case 'pending':
        return darkMode ? 'bg-gray-500 border-gray-500' : 'bg-gray-500 border-gray-500';
      default:
        return darkMode ? 'bg-gray-600 border-gray-600' : 'bg-gray-400 border-gray-400';
    }
  };
  
  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Invalid date format:', error);
      return 'Invalid date';
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex">
          {/* Timeline connector line */}
          {index < items.length - 1 && (
            <div className={`absolute top-6 left-3.5 -ml-px h-full w-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} aria-hidden="true" />
          )}
          
          {/* Timeline item */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-start">
              {/* Icon/Status circle */}
              <div className={`relative flex items-center justify-center w-7 h-7 rounded-full ${getStatusColor(item.status)} border-2 text-white shrink-0`}>
                {item.icon ? (
                  <span>{item.icon}</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              
              {/* Content */}
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium">
                  {item.title}
                </div>
                {item.description && (
                  <div className={`mt-0.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.description}
                  </div>
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`ml-2 flex-shrink-0 whitespace-nowrap text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatTimestamp(item.timestamp)}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {items.length === 0 && (
        <div className={`py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          No activity to display
        </div>
      )}
    </div>
  );
};

export default Timeline;