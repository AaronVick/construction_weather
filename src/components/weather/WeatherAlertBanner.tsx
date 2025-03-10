// src/components/weather/WeatherAlertBanner.tsx
import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { WeatherAlert } from '../../services/weatherService';

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
  className?: string;
}

const WeatherAlertBanner: React.FC<WeatherAlertBannerProps> = ({ 
  alerts,
  className
}) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!alerts || alerts.length === 0) {
    return null;
  }
  
  // Sort alerts by severity (highest first)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder: Record<string, number> = { extreme: 0, severe: 1, moderate: 2, minor: 3 };
    return (severityOrder[a.severity.toLowerCase()] || 4) - (severityOrder[b.severity.toLowerCase()] || 4);
  });
  
  // Get the most severe alert for the collapsed view
  const mostSevereAlert = sortedAlerts[0];
  
  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'text-red-600 dark:text-red-400';
      case 'severe':
        return 'text-orange-600 dark:text-orange-400';
      case 'moderate':
        return 'text-amber-600 dark:text-amber-400';
      case 'minor':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };
  
  // Get severity background color
  const getSeverityBgColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'extreme':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'severe':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'moderate':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'minor':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };
  
  return (
    <div 
      className={`
        rounded-lg overflow-hidden
        ${getSeverityBgColor(mostSevereAlert.severity)}
        ${className || ''}
      `}
    >
      {/* Alert Header */}
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <AlertTriangle className={`w-5 h-5 mr-2 ${getSeverityColor(mostSevereAlert.severity)}`} />
          <div>
            <h3 className={`font-medium ${getSeverityColor(mostSevereAlert.severity)}`}>
              {mostSevereAlert.event}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {expanded ? 'Click to collapse' : `${alerts.length} weather ${alerts.length === 1 ? 'alert' : 'alerts'}`}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>
      
      {/* Expanded Alerts */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {sortedAlerts.map((alert, index) => (
            <div 
              key={index}
              className={`
                p-3 rounded-md
                ${getSeverityBgColor(alert.severity)}
                border border-${alert.severity === 'extreme' ? 'red' : alert.severity === 'severe' ? 'orange' : alert.severity === 'moderate' ? 'amber' : 'yellow'}-200
                dark:border-${alert.severity === 'extreme' ? 'red' : alert.severity === 'severe' ? 'orange' : alert.severity === 'moderate' ? 'amber' : 'yellow'}-800
              `}
            >
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 mr-2 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                <div>
                  <h4 className={`font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.event}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {alert.desc}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Effective: {new Date(alert.effective).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>
                      Expires: {new Date(alert.expires).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Source: Weather Service
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherAlertBanner;
