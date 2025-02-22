// src/components/ui/LoadingState.tsx
import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex h-full items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
    <span className="text-gray-600 dark:text-gray-300">{message}</span>
  </div>
);