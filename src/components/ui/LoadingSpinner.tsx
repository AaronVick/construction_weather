// src/components/ui/LoadingSpinner.tsx
import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4'
  };

  return (
    <div className={`${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          border-gray-300
          border-t-blue-500
          animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;