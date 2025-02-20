// src/pages/auth/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useSupabase } from '../../contexts/SupabaseContext';
import Button from '../../components/ui/Button';

const ForgotPassword: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { resetPassword } = useSupabase();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    
    try {
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        throw resetError;
      }
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
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
            Reset your password
          </h2>
          
          {error && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="space-y-6">
              <div className={`p-4 rounded-md flex items-start ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Password reset email sent</p>
                  <p className="mt-1 text-sm">
                    Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Link
                  to="/login"
                  className={`
                    inline-flex items-center text-sm font-medium
                    ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}
                  `}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <p className={`mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`
                      block w-full pl-10 pr-3 py-2 rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }
                    `}
                    placeholder="you@example.com"
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
                  Send Reset Link
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Link
                  to="/login"
                  className={`
                    inline-flex items-center text-sm font-medium
                    ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}
                  `}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;