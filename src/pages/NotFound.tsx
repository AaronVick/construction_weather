// src/pages/NotFound.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const navigate = useNavigate();
  
  const goBack = () => {
    navigate(-1);
  };
  
  const goHome = () => {
    navigate('/');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <svg 
            className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 19h8a4 4 0 0 0 4-4 5 5 0 0 0-5-5 7 7 0 1 0-13 3 5 5 0 0 0 6 6Z" />
            <path d="m9 12 2 2 4-4" className="opacity-0" />
          </svg>
          
          <h1 className={`text-6xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            404
          </h1>
          <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Page Not Found
          </h2>
        </div>
        
        <p className={`mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          The page you're looking for doesn't exist or has been moved.
          Check the URL or try navigating to another page.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            className="inline-flex items-center justify-center"
            onClick={goBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            variant="primary"
            className="inline-flex items-center justify-center"
            onClick={goHome}
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;