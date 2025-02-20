// src/components/ui/ErrorFallback.tsx
import React from 'react';
import { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorFallback: React.FC<FallbackProps> = ({ 
  error,
  resetErrorBoundary 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-500 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            Something went wrong
          </h1>
          
          <div className="mt-4 text-gray-600 dark:text-gray-300">
            <p>
              We're sorry, but an unexpected error occurred. Our team has been notified.
            </p>
          </div>
        </div>
        
        <div className="p-4 mt-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 overflow-auto whitespace-pre-wrap">
            {error.message || 'An unknown error occurred'}
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            variant="primary"
            onClick={resetErrorBoundary}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
};

export default ErrorFallback;