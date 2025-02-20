// src/components/ui/TabNavigation.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import Tooltip from './Tooltip';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onChange,
  orientation = 'horizontal',
  size = 'md',
  fullWidth = false,
}) => {
  const { darkMode } = useTheme();
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1.5 px-2.5';
      case 'lg':
        return 'text-base py-2.5 px-5';
      case 'md':
      default:
        return 'text-sm py-2 px-4';
    }
  };
  
  return (
    <div 
      className={`
        ${orientation === 'horizontal' ? 'flex space-x-1' : 'flex flex-col space-y-1'}
        ${fullWidth && orientation === 'horizontal' ? 'w-full' : ''}
      `}
      role="tablist"
      aria-orientation={orientation}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;
        
        const tabContent = (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={`
              relative group flex items-center justify-center focus:outline-none
              ${getSizeClasses()}
              ${fullWidth && orientation === 'horizontal' ? 'flex-1' : ''}
              ${isActive 
                ? darkMode
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-blue-700 border-b-2 border-blue-500'
                : isDisabled
                  ? darkMode
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 cursor-not-allowed'
                  : darkMode
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded-md'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md'
              }
              transition-colors duration-150
            `}
          >
            {tab.icon && (
              <span className={`${tab.label ? 'mr-2' : ''} ${isDisabled ? 'opacity-50' : ''}`}>
                {tab.icon}
              </span>
            )}
            {tab.label}
            
            {isDisabled && tab.tooltip && (
              <span className="absolute right-0.5 top-0.5">
                <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
              </span>
            )}
          </button>
        );
        
        // Wrap in tooltip if disabled and has tooltip
        if (isDisabled && tab.tooltip) {
          return (
            <Tooltip key={tab.id} content={tab.tooltip} position="top">
              {tabContent}
            </Tooltip>
          );
        }
        
        return tabContent;
      })}
    </div>
  );
};

export default TabNavigation;