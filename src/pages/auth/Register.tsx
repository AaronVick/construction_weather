// src/pages/auth/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { handleFirebaseError } from '../../lib/firebaseClient';
import Button from '../../components/ui/Button';

const Register: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const { signUp } = useFirebaseAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        const errorInfo = handleFirebaseError(signUpError);
        setError(errorInfo.message || 'Failed to create account. Please try again.');
        setLoading(false);
        return;
      }
      
      // Firebase automatically signs in the user after registration
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
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
            Create your account
          </h2>
          
          {error && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-700'}`}>
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Password
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
                Confirm Password
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
            
            <div className="flex items-center">
              <input
                id="terms"
                type="checkbox"
                required
                className={`h-4 w-4 rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <label 
                htmlFor="terms" 
                className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                I agree to the{' '}
                <Link 
                  to="/terms" 
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link 
                  to="/privacy" 
                  className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
              >
                Create Account
              </Button>
            </div>
          </form>
        </div>
        
        <p className={`mt-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Already have an account?{' '}
          <Link 
            to="/login" 
            className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
