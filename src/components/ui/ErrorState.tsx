// src/components/ui/ErrorState.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export const ErrorState: React.FC<{ 
  message?: string;
  onRetry?: () => void;
}> = ({ 
  message = 'Something went wrong', 
  onRetry 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
      {message}
    </h3>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);