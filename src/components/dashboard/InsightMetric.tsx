// src/components/dashboard/InsightMetric.tsx
import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface InsightMetricProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  trend?: number;
  changePeriod?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  linkTo?: string;
  description?: string;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const InsightMetric: React.FC<InsightMetricProps> = ({
  title,
  value,
  icon,
  change,
  trend,
  changePeriod = 'last month',
  changeType = 'neutral',
  description,
  loading = false,
  className = '',
  onClick,
}) => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  
// Trend Indicator
const trendIndicator = trend !== undefined ? (
  <div className={`flex items-center text-xs font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
    {trend > 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
    {`${Math.abs(trend)}%`}
  </div>
) : null;

  const renderChangeIndicator = () => {
    if (typeof change !== 'number') return null;
    
    const changeText = `${Math.abs(change)}% vs ${changePeriod}`;
    
    // Determine color based on change type
    let colorClass = '';
    if (changeType === 'positive') {
      colorClass = 'text-green-600 dark:text-green-400';
    } else if (changeType === 'negative') {
      colorClass = 'text-red-600 dark:text-red-400';
    } else {
      colorClass = 'text-gray-600 dark:text-gray-400';
    }
    
    return (
      <div className={`flex items-center text-xs font-medium ${colorClass}`}>
        {changeType === 'positive' && <ArrowUp size={14} className="mr-1" />}
        {changeType === 'negative' && <ArrowDown size={14} className="mr-1" />}
        {changeText}
      </div>
    );
  };
  
  return (
    <div 
      className={`
        rounded-lg p-5 relative overflow-hidden
        ${darkMode ? 'bg-gray-800' : 'bg-white'}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 transform translate-x-4 -translate-y-4 opacity-10">
        {icon}
      </div>
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {title}
          </h3>
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            {icon}
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-7 w-24 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {value}
              </span>
            </div>

            {/* Render Trend Indicator */}
            {trendIndicator}

            {/* Render Change Indicator */}
            {change !== undefined && (
              <div className={`flex items-center text-xs font-medium ${changeType === 'positive' ? 'text-green-600 dark:text-green-400' : changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {changeType === 'positive' && <ArrowUp size={14} className="mr-1" />}
                {changeType === 'negative' && <ArrowDown size={14} className="mr-1" />}
                {`${Math.abs(change)}% vs ${changePeriod}`}
              </div>
            )}

            {description && (
              <p className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {description}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InsightMetric;