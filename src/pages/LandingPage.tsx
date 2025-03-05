// src/pages/LandingPage.tsx


import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import '../styles/LandingPage.css';
import heroImage from '../assets/images/hero-image.png';
import featureIcon1 from '../assets/icons/cloud-lightning.svg';
import featureIcon2 from '../assets/icons/email.svg';
import featureIcon3 from '../assets/icons/settings.svg';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import Checkout from '../components/Checkout';
import { Check, XCircle } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const LandingPage: React.FC = () => {
  // Firebase auth hook
  const { user, isLoading: authLoading, signIn, resetPassword } = useFirebaseAuth();
  
  // State management
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already logged in, check for stored plan
      const storedPlan = localStorage.getItem('selectedPlan');
      if (storedPlan) {
        handlePlanSelect(storedPlan);
        localStorage.removeItem('selectedPlan');
      }
    }
  }, [user]);

  /**
   * Handles user login with Firebase
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        throw result.error;
      }
      
      // Successfully signed in
      setIsLoginModalOpen(false);
      
      // Check if there's a stored plan selection
      const storedPlan = localStorage.getItem('selectedPlan');
      if (storedPlan) {
        await handlePlanSelect(storedPlan);
        localStorage.removeItem('selectedPlan');
      } else {
        // No stored plan, redirect to dashboard
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles forgot password request with Firebase
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        throw result.error;
      }
      
      alert('Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles plan selection for both logged-in and non-logged-in users
   */
  const handlePlanSelect = async (planId: string, cycle: 'monthly' | 'annual' = 'monthly') => {
    try {
      console.log('Plan selected:', planId, 'Billing cycle:', cycle);
      setIsLoading(true);
      setBillingCycle(cycle);
      
      // Proceed directly to checkout for both logged-in and non-logged-in users
      await handleCheckout(planId, cycle);
    } catch (error) {
      console.error('Error in plan selection:', error);
      setError('Failed to process plan selection. Please try again.');
      setIsLoading(false);
    }
  };
  
  /**
   * Handles checkout for authenticated users
   */
  const handleCheckout = async (planId: string, cycle: 'monthly' | 'annual' = 'monthly') => {
    try {
      setIsLoading(true);
      console.log('Starting checkout for plan:', planId);
      
      // Use the appropriate checkout endpoint based on user authentication
      const endpoint = user 
        ? '/api/stripe/create-checkout-session'
        : '/api/stripe/create-guest-checkout';
      
      const requestBody = user 
        ? {
            userId: user.uid,
            email: user.email,
            plan: planId,
            billingCycle: cycle
          }
        : {
            plan: planId,
            billingCycle: cycle
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      const data = await response.json();
      console.log('API Response:', data);
  
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create checkout session');
      }
  
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
  
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });
  
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles closing the checkout modal
   */
  const handleCloseCheckout = () => {
    setSelectedPlan(null);
    localStorage.removeItem('selectedPlan');
  };



  return (
    <div className="landing-page">
      {/* Login Button */}
      <button className="login-button" onClick={() => setIsLoginModalOpen(true)}>
        Login
      </button>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{isForgotPassword ? 'Reset Password' : 'Login'}</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {!isForgotPassword && (
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
              <button type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Loading...'
                  : isForgotPassword
                  ? 'Send Reset Link'
                  : 'Login'}
              </button>
            </form>
            <p>
              {isForgotPassword ? (
                <span onClick={() => setIsForgotPassword(false)}>Back to Login</span>
              ) : (
                <span onClick={() => setIsForgotPassword(true)}>Forgot Password?</span>
              )}
            </p>
            <button className="close-modal" onClick={() => setIsLoginModalOpen(false)}>
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Automate Weather Delay Notifications for Your Jobsite</h1>
          <p>Save time and keep your team informed with automated weather alerts.</p>
          <div className="cta-buttons">
            <button className="primary-cta" onClick={() => handlePlanSelect('basic')}>
              Get Started
            </button>
            <button className="secondary-cta">Learn More</button>
          </div>
        </div>
        <div className="hero-image">
          <img src={heroImage} alt="Construction site with weather overlay" />
        </div>
      </section>


      {/* Features Section */}
        <section className="features-section text-center py-10">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="max-w-6xl mx-auto px-4"> {/* Add a max-width and center it */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="feature-card border border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <img src={featureIcon1} alt="Automated Weather Monitoring" className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">Automated Weather Monitoring</h3>
                <p className="text-gray-600">Our platform checks local weather conditions in real-time.</p>
              </div>
              <div className="feature-card border border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <img src={featureIcon2} alt="Instant Notifications" className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">Instant Notifications</h3>
                <p className="text-gray-600">Automatically send emails to workers and managers.</p>
              </div>
              <div className="feature-card border border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <img src={featureIcon3} alt="Customizable Alerts" className="w-16 h-16 mb-4" />
                <h3 className="text-xl font-semibold">Customizable Alerts</h3>
                <p className="text-gray-600">Tailor alerts to specific jobsites or teams.</p>
              </div>
            </div>
          </div>
        </section>



      {/* Updated Pricing Section */}
<section className="bg-gray-50 py-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
        Choose Your Plan
      </h2>
      <p className="mt-4 text-xl text-gray-600">
        Select the perfect plan for your business needs
      </p>
      
      {/* Billing cycle toggle */}
      <div className="mt-6 inline-flex items-center bg-gray-200 rounded-lg p-1">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            billingCycle === 'monthly'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-700 hover:text-indigo-600'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            billingCycle === 'annual'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-700 hover:text-indigo-600'
          }`}
        >
          Annual <span className="text-xs text-green-600 ml-1">Save 20%</span>
        </button>
      </div>
    </div>

    <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
      {/* Basic Plan */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900">Basic</h3>
          <p className="mt-4 text-sm text-gray-500">Perfect for small teams getting started</p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">$29.99</span>
            <span className="text-base font-medium text-gray-500">/month</span>
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">1 Jobsite</span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Email Notifications</span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Email Support</span>
            </li>
          </ul>
          <button
  onClick={() => handlePlanSelect('basic', billingCycle)}
  disabled={isLoading}
  className={`mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md text-center ${
    isLoading ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isLoading ? 'Processing...' : `Select ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan`}
</button>
        </div>
      </div>

      {/* Premium Plan */}
      <div className="bg-white border border-indigo-200 rounded-lg shadow-sm divide-y divide-gray-200 ring-2 ring-indigo-600">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900">Premium</h3>
          <p className="mt-4 text-sm text-gray-500">Best for growing businesses</p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">$59.99</span>
            <span className="text-base font-medium text-gray-500">/month</span>
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Up to 10 Jobsites</span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">
                SMS Notifications
                <span className="ml-2 text-xs text-indigo-600">*coming soon*</span>
              </span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Advanced Analytics</span>
            </li>
          </ul>
          <button
  onClick={() => handlePlanSelect('premium', billingCycle)}
  disabled={isLoading}
  className={`mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md text-center ${
    isLoading ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isLoading ? 'Processing...' : `Select ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan`}
</button>
        </div>
      </div>

      {/* Enterprise Plan */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
          <p className="mt-4 text-sm text-gray-500">For large-scale operations</p>
          <p className="mt-8">
            <span className="text-4xl font-extrabold text-gray-900">$199.99</span>
            <span className="text-base font-medium text-gray-500">/month</span>
          </p>
          <ul className="mt-6 space-y-4">
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Unlimited Jobsites</span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">Custom Workflows</span>
            </li>
            <li className="flex space-x-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base text-gray-500">All Features Unlocked</span>
            </li>
          </ul>
          <button
  onClick={() => handlePlanSelect('enterprise', billingCycle)}
  disabled={isLoading}
  className={`mt-8 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-md text-center ${
    isLoading ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isLoading ? 'Processing...' : `Select ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Plan`}
</button>
        </div>
      </div>
    </div>
  </div>
</section>

    </div>
  );
};


export default LandingPage;
