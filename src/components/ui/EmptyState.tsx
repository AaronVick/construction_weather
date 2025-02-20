// src/components/ui/EmptyState.tsx
import React from 'react';
import Button from './Button';
import { useTheme } from '../../hooks/useTheme';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  const { darkMode } = useTheme();
  
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center px-4 py-12
        ${className}
      `}
    >
      {icon && (
        <div className={`mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {icon}
        </div>
      )}
      
      <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      
      <p className={`text-sm max-w-md mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;