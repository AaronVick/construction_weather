// src/pages/dashboard/Subscription.tsx

/**
 * Subscription Management Component
 * 
 * Handles all subscription-related functionality including:
 * - Viewing and changing subscription plans
 * - Managing billing details
 * - Viewing billing history
 * - Handling plan upgrades/downgrades
 * - Processing subscription cancellations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import { useToast } from '../../hooks/useToast';
import { getSubscriptionDetails, updateSubscriptionPlan, getBillingHistory } from '../../services/subscriptionService';
import { db, auth } from '../../lib/firebaseClient';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BillingHistory from '../../components/subscription/BillingHistory';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Utils
import { createUpdatedSubscription, getNextBillingDate } from '../../utils/subscriptionHelpers';

// Use type-only imports to avoid naming conflicts
import type { 
  Subscription as SubscriptionType,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
  PlanOption,
  BillingHistoryItem,
  PaymentMethodData,
  SubscriptionFeatures
} from '../../types/subscription';

// Icons
import {
  Check,
  AlertTriangle,
  Clock,
  Building,
  Users,
  Mail,
  Cloud,
  BarChart2,
  Headphones,
  Shield,
  Star,
  MapPin,
  MessageSquare,
  FileText,
  FileCog,
  XCircle
} from 'lucide-react';

interface PlanDetailsWithUI extends PlanOption {
  icon: React.ReactNode;
  recommendedFor: string;
  features: string[];
  limitations: string[];
}

/**
 * Feature category interface for the comparison table
 */
interface FeatureCategory {
  category: string;
  features: {
    name: string;
    description: string;
    basic: boolean | string;
    premium: boolean | string;
    enterprise: boolean | string;
    icon: React.ReactNode;
  }[];
}

const Subscription: React.FC = () => {
  // Hooks and Context
  const theme = useTheme();
  const darkMode = theme?.darkMode ?? false;
  const navigate = useNavigate();
  const { subscription, setSubscription } = useSubscription();
  const { showToast } = useToast();

  // Component State
  const [loading, setLoading] = useState<boolean>(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState<boolean>(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState<boolean>(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'plans' | 'details' | 'history'>('plans');
  const [user, setUser] = useState<any>(null);

  // Plan Definitions
  const plans: PlanDetailsWithUI[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for small teams and simple workflows',
      price: {
        monthly: 29.99,
        annually: 287.99,
      },
      features: [
        'Unlimited clients',
        'Weather-based notifications',
        'Email automation',
        'Single jobsite',
        'Basic support'
      ],
      limitations: [
        'No jobsite-specific notifications',
        'Limited analytics',
        'No priority support'
      ],
      icon: <Building size={24} />,
      recommendedFor: 'Individuals and small businesses'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Advanced features for growing businesses',
      price: {
        monthly: 59.99,
        annually: 575.99,
      },
      features: [
        'Everything in Basic',
        'Multiple jobsites (up to 10)',
        'Jobsite-specific notifications',
        'Advanced analytics',
        'Priority support',
        'Custom email templates'
      ],
      limitations: [
        'Limited advanced customizations',
        'Standard API rate limits'
      ],
      icon: <Star size={24} />,
      recommendedFor: 'Growing businesses with multiple projects'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Comprehensive solution for large organizations',
      price: {
        monthly: 199.99,
        annually: 1919.99,
      },
      features: [
        'Everything in Premium',
        'Unlimited jobsites',
        'Custom workflows',
        'Advanced reporting',
        'Dedicated support',
        'API access',
        'White labeling',
        'SSO authentication'
      ],
      limitations: [],
      icon: <Building size={24} />,
      recommendedFor: 'Large organizations with complex needs'
    }
  ];


  /**
   * Fetches subscription details from the backend
   */
  const fetchSubscriptionDetails = async (): Promise<void> => {
    try {
      setLoading(true);
      const details = await getSubscriptionDetails();
      setSubscription(details);
      setBillingCycle(details.billing_cycle);
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
      showToast('Failed to load subscription information', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetches billing history from the backend
   */
  const fetchBillingHistory = async (): Promise<void> => {
    try {
      const history = await getBillingHistory();
      setBillingHistory(history);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      showToast('Failed to load billing history', 'error');
    }
  };

  /**
   * Handles plan selection and shows appropriate dialog
   */
  const handlePlanSelect = (plan: SubscriptionPlan): void => {
    if (!subscription || plan === subscription.plan) return;

    const currentPlanIndex = plans.findIndex((p) => p.id === subscription.plan);
    const newPlanIndex = plans.findIndex((p) => p.id === plan);

    setSelectedPlan(plan);

    if (newPlanIndex > currentPlanIndex) {
      setUpgradeDialogOpen(true);
    } else {
      setDowngradeDialogOpen(true);
    }
  };

  /**
   * Confirms plan change and processes the update
   */
  const confirmPlanChange = async (): Promise<void> => {
    if (!selectedPlan || !subscription) return;
    
    try {
      setLoading(true);
      await updateSubscriptionPlan(selectedPlan);
      
      const nextBillingDate = getNextBillingDate(billingCycle);
      
      const updatedSubscription: SubscriptionType = {
        ...subscription,
        plan: selectedPlan,
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        currentPeriodEnd: nextBillingDate,
        updated_at: new Date().toISOString()
      };
  
      setSubscription(updatedSubscription);
      showToast(`Successfully updated to ${selectedPlan} plan`, 'success');
      setUpgradeDialogOpen(false);
      setDowngradeDialogOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update subscription:', error);
      showToast('Failed to update subscription. Please try again or contact support.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles subscription cancellation
   */
  const confirmCancelSubscription = async (): Promise<void> => {
    if (!subscription) return;
    
    try {
      setLoading(true);
      await updateSubscriptionPlan('none');
      
      const nextBillingDate = getNextBillingDate(subscription.billing_cycle);
      const endDate = getEndOfCurrentBillingPeriod();
      
      const updatedSubscription: SubscriptionType = {
        ...subscription,
        plan: 'none',
        status: 'canceled',
        end_date: endDate,
        currentPeriodEnd: nextBillingDate,
        updated_at: new Date().toISOString()
      };
  
      setSubscription(updatedSubscription);
      showToast('Your subscription has been canceled', 'success');
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showToast('Failed to cancel subscription. Please try again or contact support.', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculates prorated credit for plan changes
   */
  const calculateProratedCredit = (): number => {
    if (!selectedPlan || !subscription) return 0;

    const currentPlanPrice = getCurrentPlanPrice();
    const daysLeft = getDaysLeftInBillingCycle();
    const totalDays = getTotalDaysInBillingCycle();

    return parseFloat((currentPlanPrice * (daysLeft / totalDays)).toFixed(2));
  };

  /**
   * Calculates the charge for today based on plan change
   */
  const calculateTodaysCharge = (): number => {
    if (!selectedPlan) return 0;

    const planDetails = plans.find((p) => p.id === selectedPlan);
    if (!planDetails) return 0;

    const newPlanPrice = billingCycle === 'monthly' ? planDetails.price.monthly : planDetails.price.annually;
    const proratedCredit = calculateProratedCredit();

    return parseFloat((Math.max(0, newPlanPrice - proratedCredit)).toFixed(2));
  };

  // Utility methods
  const getCurrentPlanPrice = (): number => {
    if (!subscription) return 0;
    const currentPlan = plans.find((p) => p.id === subscription.plan);
    return currentPlan ? (subscription.billing_cycle === 'monthly' ? currentPlan.price.monthly : currentPlan.price.annually) : 0;
  };

  const getDaysLeftInBillingCycle = (): number => {
    if (!subscription?.next_billing_date) return 0;
    const today = new Date();
    const nextBilling = new Date(subscription.next_billing_date);
    const diffTime = nextBilling.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getTotalDaysInBillingCycle = (): number => {
    return subscription?.billing_cycle === 'monthly' ? 30 : 365;
  };

  const getEndOfCurrentBillingPeriod = (): string => {
    return subscription?.next_billing_date || new Date().toISOString();
  };

  // Effects
  useEffect(() => {
    fetchSubscriptionDetails();
    fetchBillingHistory();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
      }
    };
    getUser();
  }, []);

  // Loading state
  if (loading && !subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render methods for dialogs
  // Inside Subscription.tsx

  /**
   * Renders the upgrade dialog content
   */
  const renderUpgradeDialogContent = (): React.ReactNode => {
    if (!selectedPlan) return null;
    const planDetails = plans.find(p => p.id === selectedPlan);
    if (!planDetails) return null;
    
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Upgrade to {planDetails.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You're upgrading from {subscription?.plan} to {selectedPlan}. Your new features will be available immediately.
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
          <h4 className="font-medium flex items-center">
            <Check size={18} className="text-green-500 mr-2" />
            New features you'll get
          </h4>
          <ul className="mt-2 space-y-1">
            {planDetails.features
              .filter(feature => !plans.find(p => p.id === subscription?.plan)?.features.includes(feature))
              .map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check size={14} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
          </ul>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Billing details</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 text-sm rounded-md ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-3 py-1 text-sm rounded-md flex items-center ${
                  billingCycle === 'annually'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Annually
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span>New plan: {planDetails.name} ({billingCycle})</span>
              <span>${billingCycle === 'monthly' ? planDetails.price.monthly : planDetails.price.annually}</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-500 dark:text-gray-400">
              <span>Current plan: {subscription?.plan} (prorated credit)</span>
              <span>-${calculateProratedCredit()}</span>
            </div>
            <div className="border-t dark:border-gray-700 my-2 pt-2 flex justify-between font-medium">
              <span>Today's charge</span>
              <span>${calculateTodaysCharge()}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Next billing: {new Date(getNextBillingDate(billingCycle)).toLocaleDateString()}
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders the downgrade dialog content
   */
  const renderDowngradeDialogContent = (): React.ReactNode => {
    if (!selectedPlan) return null;
    const planDetails = plans.find(p => p.id === selectedPlan);
    if (!planDetails) return null;
    
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Downgrade to {planDetails.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You're downgrading from {subscription?.plan} to {selectedPlan}. Changes will take effect at the end of your current billing period.
          </p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md mb-4">
          <h4 className="font-medium flex items-center">
            <AlertTriangle size={18} className="text-amber-500 mr-2" />
            Features you'll lose
          </h4>
          <ul className="mt-2 space-y-1">
            {plans.find(p => p.id === subscription?.plan)?.features
              .filter(feature => !planDetails.features.includes(feature))
              .map((feature, index) => (
                <li key={index} className="flex items-start">
                  <XCircle size={14} className="text-amber-500 mt-1 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
          </ul>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Billing details</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 text-sm rounded-md ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-3 py-1 text-sm rounded-md flex items-center ${
                  billingCycle === 'annually'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Annually
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span>Current plan: {subscription?.plan}</span>
              <span>Active until: {new Date(subscription?.next_billing_date || '').toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>New plan: {planDetails.name} ({billingCycle})</span>
              <span>${billingCycle === 'monthly' ? planDetails.price.monthly : planDetails.price.annually}/
                {billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your plan will change on {new Date(subscription?.next_billing_date || '').toLocaleDateString()}.
              You'll continue to have access to your current features until then.
            </div>
          </div>
        </div>
      </>
    );
  };

  /**
   * Renders the cancel dialog content
   */
  const renderCancelDialogContent = (): React.ReactNode => {
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Cancel Subscription</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to cancel your subscription? You'll lose access to all premium features.
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-4">
          <h4 className="font-medium flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle size={18} className="mr-2" />
            What you'll lose
          </h4>
          <ul className="mt-2 space-y-1">
            {subscription?.plan !== 'basic' && plans.find(p => p.id === subscription?.plan)?.features
              .filter(feature => !plans.find(p => p.id === 'basic')?.features.includes(feature))
              .map((feature, index) => (
                <li key={index} className="flex items-start">
                  <XCircle size={14} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
          </ul>
        </div>
        
        <div className="mb-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
            <div className="flex justify-between mb-2">
              <span>Current plan: {subscription?.plan}</span>
              <span>Active until: {new Date(subscription?.next_billing_date || '').toLocaleDateString()}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your subscription will remain active until the end of your current billing period. 
              You won't be charged again after that date.
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-8">
      {/* Dialog components */}
      <ConfirmDialog
        isOpen={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        onConfirm={confirmPlanChange}
        title="Upgrade Plan"
        message=""
        confirmText="Confirm Upgrade"
        cancelText="Cancel"
        confirmVariant="primary"
        loading={loading}
      >
        {renderUpgradeDialogContent()}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
        onConfirm={confirmPlanChange}
        title="Downgrade Plan"
        message=""
        confirmText="Confirm Downgrade"
        cancelText="Cancel"
        confirmVariant="warning"
        loading={loading}
      >
        {renderDowngradeDialogContent()}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={confirmCancelSubscription}
        title="Cancel Subscription"
        message=""
        confirmText="Cancel Subscription"
        cancelText="Keep Subscription"
        confirmVariant="danger"
        loading={loading}
      >
        {renderCancelDialogContent()}
      </ConfirmDialog>

      {/* Main content */}
      <div>
        <h1 className="text-2xl font-semibold">Subscription & Billing</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Subscription Status Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium mb-1">
              Current Plan: {subscription?.plan.charAt(0).toUpperCase() + subscription?.plan.slice(1)}
            </h2>

            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {subscription?.status === 'active' ? (
                <>
                  <span className="inline-flex items-center mr-2">
                    <Check size={16} className="text-green-500 mr-1" />
                    Active
                  </span>
                  <span>
                    Next billing on {new Date(subscription?.next_billing_date || '').toLocaleDateString()} 
                    ({subscription?.billing_cycle})
                  </span>
                </>
              ) : subscription?.status === 'trial' ? (
                <>
                  <span className="inline-flex items-center mr-2">
                    <Clock size={16} className="text-blue-500 mr-1" />
                    Trial
                  </span>
                  <span>
                    Trial ends on {new Date(subscription?.trial_end || '').toLocaleDateString()}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center mr-2">
                    <AlertTriangle size={16} className="text-red-500 mr-1" />
                    {subscription?.status === 'canceled' ? 'Canceled' : 'Inactive'}
                  </span>
                  {subscription?.end_date && (
                    <span>
                      Active until {new Date(subscription.end_date).toLocaleDateString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {subscription?.status === 'active' && (
              <Button variant="danger" onClick={() => setCancelDialogOpen(true)}>
                Cancel Subscription
              </Button>
            )}
            <Button variant="primary" onClick={() => setActiveTab('plans')}>
              {subscription?.status === 'active' ? 'Change Plan' : 'View Plans'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b dark:border-gray-700 mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-3 border-b-2 font-medium ${
              activeTab === 'plans' ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 font-medium ${
              activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Billing Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 font-medium ${
              activeTab === 'history' ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Billing History
          </button>
        </div>
      </div>

      {/* Plans Tab Content */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-end">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  billingCycle === 'annually'
                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                Annually
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${
                plan.id === subscription?.plan ? 'ring-2 ring-blue-500' : ''
              }`}>
                {plan.id === subscription?.plan && (
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                      Current Plan
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="mr-3">{plan.icon}</div>
                    <div>
                      <h3 className="text-lg font-medium">{plan.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold">
                        ${billingCycle === 'monthly' ? plan.price.monthly : plan.price.annually}
                      </span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium">Features:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-medium">Limitations:</h4>
                        <ul className="space-y-2">
                          {plan.limitations.map((limitation, index) => (
                            <li key={index} className="flex items-start">
                              <XCircle size={16} className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                              <span className="text-sm">{limitation}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <Button
                    variant={plan.id === subscription?.plan ? 'secondary' : 'primary'}
                    className="w-full"
                    disabled={plan.id === subscription?.plan}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.id === subscription?.plan ? 'Current Plan' : 'Select Plan'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === 'history' && (
        <Card>
          <h2 className="text-lg font-medium mb-4">Billing History</h2>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : billingHistory?.length > 0 ? (
            <BillingHistory items={billingHistory} />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-6">
              No billing history available.
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Subscription;
