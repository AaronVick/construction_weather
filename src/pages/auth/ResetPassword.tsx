// src/pages/auth/ResetPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { handleFirebaseError } from '../../lib/firebaseClient';
import Button from '../../components/ui/Button';

const ResetPassword: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { updatePassword } = useFirebaseAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidResetLink, setIsValidResetLink] = useState(true);
  
  // Check if we have a valid reset token in the URL
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // Remove the # character
    
    if (!params.has('access_token')) {
      setIsValidResetLink(false);
      setError('Invalid or expired password reset link');
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error: updateError } = await updatePassword(password);
      
      if (updateError) {
        const errorInfo = handleFirebaseError(updateError);
        setError(errorInfo.message || 'Failed to reset password. Please try again.');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      
      // Redirect to login after a few seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  if (!isValidResetLink) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <AlertCircle className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Invalid Reset Link
              </h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                The password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/forgot-password')}
              >
                Request New Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <svg 
              className={`w-10 h-10 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
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
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Weather Crew
            </h1>
          </div>
        </div>
        
        <div className={`rounded-lg shadow-lg p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-semibold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Create New Password
          </h2>
          
          {error && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className={`p-4 rounded-md flex items-start ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Password successfully reset</p>
                <p className="mt-1 text-sm">
                  Your password has been reset. You will be redirected to the login page in a few seconds.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Create a new password for your account. Your password should be at least 8 characters long.
                </p>
              </div>
              
              <div className="space-y-2">
                <label 
                  htmlFor="password" 
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`
                      block w-full pl-10 pr-3 py-2 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }
                    `}
                    placeholder="••••••••"
                  />
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Must be at least 8 characters long
                </p>
              </div>
              
              <div className="space-y-2">
                <label 
                  htmlFor="confirm-password" 
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={`
                      block w-full pl-10 pr-3 py-2 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }
                    `}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
