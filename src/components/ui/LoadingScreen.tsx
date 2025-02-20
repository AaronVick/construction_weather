// src/components/ui/LoadingScreen.tsx
import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...' 
}) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="flex flex-col items-center">
        {/* Logo or app icon */}
        <div className="mb-8">
          <svg 
            className={`w-16 h-16 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 19h8a4 4 0 0 0 4-4 5 5 0 0 0-5-5 7 7 0 1 0-13 3 5 5 0 0 0 6 6Z" />
          </svg>
        </div>
        
        {/* Spinner animation */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-t-4 border-blue-600 dark:border-blue-400 animate-spin"></div>
        </div>
        
        {/* Loading message */}
        <p className="mt-6 text-gray-700 dark:text-gray-300 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;