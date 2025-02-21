// src/pages/dashboard/Subscription.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSubscription } from '../../hooks/useSubscription';
import { useToast } from '../../hooks/useToast';
import { getSubscriptionDetails, updateSubscriptionPlan, getBillingHistory } from '../../services/subscriptionService';
import { supabase } from '../../lib/supabaseClient';

// Components
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PlanCard from '../../components/subscription/PlanCard';
import FeatureComparison from '../../components/subscription/FeatureComparison';
import PaymentMethodForm from '../../components/subscription/PaymentMethodForm';
import BillingHistory from '../../components/subscription/BillingHistory';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Icons
import {
  CreditCard,
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
  Calendar,
  MapPin,
  MessageSquare,
  FileText,
  FileCog,
  XCircle
} from 'lucide-react';

// Types
import { SubscriptionPlan, BillingCycle, BillingHistory as BillingHistoryType } from '../../types/subscription';



const Subscription: React.FC = () => {
  const theme = useTheme();
const darkMode = theme ? theme.darkMode : false;
  const navigate = useNavigate();
  const { subscription, setSubscription } = useSubscription();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [billingHistory, setBillingHistory] = useState<BillingHistoryType[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'details' | 'history'>('plans');
  const [user, setUser] = useState<any>(null);
  
  const plans: Array<{
    id: SubscriptionPlan;
    name: string;
    description: string;
    price: {
      monthly: number;
      annually: number;
    };
    features: string[];
    limitations: string[];
    icon: React.ReactNode;
    recommendedFor: string;
  }> = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Essential features for small teams and simple workflows',
      price: {
        monthly: 9.99,
        annually: 99.99,
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
        monthly: 24.99,
        annually: 249.99,
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
        monthly: 49.99,
        annually: 499.99,
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

  const featureComparison = [
    {
      category: 'Core Features',
      features: [
        {
          name: 'Client Management',
          description: 'Add, edit, and manage clients',
          basic: true,
          premium: true,
          enterprise: true,
          icon: <Users size={18} />
        },
        {
          name: 'Worker Management',
          description: 'Manage crew members and their contact information',
          basic: true,
          premium: true,
          enterprise: true,
          icon: <Users size={18} />
        },
        {
          name: 'Weather Monitoring',
          description: 'Automated weather condition checking',
          basic: true,
          premium: true,
          enterprise: true,
          icon: <Cloud size={18} />
        }
      ]
    },
    {
      category: 'Jobsites',
      features: [
        {
          name: 'Number of Jobsites',
          description: 'How many locations you can manage',
          basic: '1',
          premium: '10',
          enterprise: 'Unlimited',
          icon: <MapPin size={18} />
        },
        {
          name: 'Jobsite-specific Notifications',
          description: 'Send targeted notifications per jobsite',
          basic: false,
          premium: true,
          enterprise: true,
          icon: <Mail size={18} />
        },
        {
          name: 'Crew Assignment',
          description: 'Assign workers to specific jobsites',
          basic: false,
          premium: true,
          enterprise: true,
          icon: <Users size={18} />
        }
      ]
    },
    {
      category: 'Notifications',
      features: [
        {
          name: 'Email Notifications',
          description: 'Automated emails based on weather conditions',
          basic: true,
          premium: true,
          enterprise: true,
          icon: <Mail size={18} />
        },
        {
          name: 'Custom Email Templates',
          description: 'Create and save multiple email templates',
          basic: '1 template',
          premium: '5 templates',
          enterprise: 'Unlimited',
          icon: <FileCog size={18} />
        },
        {
          name: 'SMS Notifications',
          description: 'Text message alerts for critical conditions',
          basic: false,
          premium: true,
          enterprise: true,
          icon: <MessageSquare size={18} />
        }
      ]
    },
    {
      category: 'Analytics & Reporting',
      features: [
        {
          name: 'Basic Dashboard',
          description: 'Simple overview of system activity',
          basic: true,
          premium: true,
          enterprise: true,
          icon: <BarChart2 size={18} />
        },
        {
          name: 'Advanced Analytics',
          description: 'Detailed insights and historical data',
          basic: false,
          premium: true,
          enterprise: true,
          icon: <BarChart2 size={18} />
        },
        {
          name: 'Custom Reports',
          description: 'Generate and schedule custom reports',
          basic: false,
          premium: false,
          enterprise: true,
          icon: <FileText size={18} />
        }
      ]
    },
    {
      category: 'Support & Security',
      features: [
        {
          name: 'Customer Support',
          description: 'Access to help and technical assistance',
          basic: 'Email support',
          premium: 'Priority support',
          enterprise: 'Dedicated support',
          icon: <Headphones size={18} />
        },
        {
          name: 'SLA Response Time',
          description: 'Guaranteed response time for issues',
          basic: '48 hours',
          premium: '12 hours',
          enterprise: '4 hours',
          icon: <Clock size={18} />
        },
        {
          name: 'Advanced Security',
          description: 'Enhanced security features',
          basic: 'Standard',
          premium: 'Advanced',
          enterprise: 'Enterprise-grade',
          icon: <Shield size={18} />
        }
      ]
    }
  ];

  useEffect(() => {
    fetchSubscriptionDetails();
    fetchBillingHistory();
  }, []);

  const fetchSubscriptionDetails = async () => {
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

  const fetchBillingHistory = async () => {
    try {
      const history = await getBillingHistory();
      setBillingHistory(history);
    } catch (error) {
      console.error('Failed to fetch billing history:', error);
      showToast('Failed to load billing history', 'error');
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan === subscription.plan) return;

    const currentPlanIndex = plans.findIndex((p) => p.id === subscription.plan);
    const newPlanIndex = plans.findIndex((p) => p.id === plan);

    setSelectedPlan(plan);

    if (newPlanIndex > currentPlanIndex) {
      setUpgradeDialogOpen(true);
    } else {
      setDowngradeDialogOpen(true);
    }
  };

  const handleCancelSubscription = () => {
    setCancelDialogOpen(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan) return;
  
    try {
      setLoading(true);
      await updateSubscriptionPlan(selectedPlan, billingCycle);
  
      setSubscription((prev) => ({
        ...prev,
        plan: selectedPlan,
        billing_cycle: billingCycle, // ✅ Correct casing
        next_billing_date: getNextBillingDate(billingCycle), 
        updated_at: new Date().toISOString(), // ✅ Ensure timestamp is updated
      }));
  
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
  
  

  const confirmCancelSubscription = async () => {
    try {
      setLoading(true);
      await updateSubscriptionPlan('none', 'monthly');
  
      setSubscription((prev) => ({
        ...prev,
        plan: 'none',
        status: 'canceled',
        billing_cycle: 'monthly', // Ensure correct casing
        end_date: getEndOfCurrentBillingPeriod(),
        updated_at: new Date().toISOString() // Ensure timestamp is updated
      }));
  
      showToast('Your subscription has been canceled', 'success');
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      showToast('Failed to cancel subscription. Please try again or contact support.', 'error');
    } finally {
      setLoading(false);
    }
  };
  

  const getNextBillingDate = (cycle: BillingCycle): string => {
    const today = new Date();
    if (cycle === 'monthly') {
      today.setMonth(today.getMonth() + 1);
    } else {
      today.setFullYear(today.getFullYear() + 1);
    }
    return today.toISOString();
  };

  const getEndOfCurrentBillingPeriod = (): string => {
    const currentBillingEndDate = new Date(subscription.next_billing_date);
    return currentBillingEndDate.toISOString();
  };

  const calculateProratedCredit = (): number => {
    if (!selectedPlan) return 0;

    const currentPlanPrice = getCurrentPlanPrice();
    const daysLeft = getDaysLeftInBillingCycle();
    const totalDays = getTotalDaysInBillingCycle();

    return parseFloat((currentPlanPrice * (daysLeft / totalDays)).toFixed(2));
  };

  const calculateTodaysCharge = (): number => {
    if (!selectedPlan) return 0;

    const planDetails = plans.find((p) => p.id === selectedPlan);
    if (!planDetails) return 0;

    const newPlanPrice = billingCycle === 'monthly' ? planDetails.price.monthly : planDetails.price.annually;
    const proratedCredit = calculateProratedCredit();
    const charge = Math.max(0, newPlanPrice - proratedCredit);

    return parseFloat(charge.toFixed(2));
  };

  const getCurrentPlanPrice = (): number => {
    const currentPlan = plans.find((p) => p.id === subscription.plan);
    if (!currentPlan) return 0;

    return subscription.billing_cycle === 'monthly' ? currentPlan.price.monthly : currentPlan.price.annually;
  };

  const getDaysLeftInBillingCycle = (): number => {
    const today = new Date();
    const nextBilling = new Date(subscription.next_billing_date);
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const getTotalDaysInBillingCycle = (): number => {
    return subscription.billing_cycle === 'monthly' ? 30 : 365;
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  if (loading && !subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderUpgradeDialogContent = () => {
    if (!selectedPlan) return null;
    const planDetails = plans.find(p => p.id === selectedPlan);
    if (!planDetails) return null;
    
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Upgrade to {planDetails.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You're upgrading from {subscription.plan} to {selectedPlan}. Your new features will be available immediately.
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
          <h4 className="font-medium flex items-center">
            <Check size={18} className="text-green-500 mr-2" />
            New features you'll get
          </h4>
          <ul className="mt-2 space-y-1">
            {planDetails.features
              .filter(feature => !plans.find(p => p.id === subscription.plan)?.features.includes(feature))
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
              <span>Current plan: {subscription.plan} (prorated credit)</span>
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

  const renderDowngradeDialogContent = () => {
    if (!selectedPlan) return null;
    const planDetails = plans.find(p => p.id === selectedPlan);
    if (!planDetails) return null;
    
    return (
      <>
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Downgrade to {planDetails.name}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You're downgrading from {subscription.plan} to {selectedPlan}. Changes will take effect at the end of your current billing period.
          </p>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md mb-4">
          <h4 className="font-medium flex items-center">
            <AlertTriangle size={18} className="text-amber-500 mr-2" />
            Features you'll lose
          </h4>
          <ul className="mt-2 space-y-1">
            {plans.find(p => p.id === subscription.plan)?.features
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
              <span>Current plan: {subscription.plan}</span>
              <span>Active until: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>New plan: {planDetails.name} ({billingCycle})</span>
              <span>${billingCycle === 'monthly' ? planDetails.price.monthly : planDetails.price.annually}/
                {billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Your plan will change on {new Date(subscription.next_billing_date).toLocaleDateString()}.
              You'll continue to have access to your current features until then.
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderCancelDialogContent = () => {
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
            {subscription.plan !== 'basic' && plans.find(p => p.id === subscription.plan)?.features
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
              <span>Current plan: {subscription.plan}</span>
              <span>Active until: {new Date(subscription.next_billing_date).toLocaleDateString()}</span>
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

  if (loading && !subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);



  return (
    <div className="space-y-8">
      {/* Upgrade/Downgrade Dialogs */}
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
      
      {/* Header */}
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
            <h2 className="text-lg font-medium mb-1">Current Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}</h2>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {subscription.status === 'active' ? (
                <>
                  <span className="inline-flex items-center mr-2">
                    <Check size={16} className="text-green-500 mr-1" />
                    Active
                  </span>
                  <span>
                    Next billing on {new Date(subscription.next_billing_date).toLocaleDateString()} 
                    ({subscription.billing_cycle})
                  </span>
                </>
              ) : subscription.status === 'trial' ? (
                <>
                  <span className="inline-flex items-center mr-2">
                    <Clock size={16} className="text-blue-500 mr-1" />
                    Trial
                  </span>
                  <span>
                    Trial ends on {new Date(subscription.trial_end!).toLocaleDateString()}
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center mr-2">
                    <AlertTriangle size={16} className="text-red-500 mr-1" />
                    {subscription.status === 'canceled' ? 'Canceled' : 'Inactive'}
                  </span>
                  {subscription.end_date && (
                    <span>
                      Active until {new Date(subscription.end_date).toLocaleDateString()}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {subscription.status === 'active' && (
              <Button
                variant="danger"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => setActiveTab('plans')}
            >
              {subscription.status === 'active' ? 'Change Plan' : 'View Plans'}
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
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 font-medium ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Billing Details
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 font-medium ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            Billing History
          </button>
        </div>
      </div>
      
      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annually')}
                className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
                  billingCycle === 'annually'
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Annually
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                isCurrentPlan={subscription.plan === plan.id}
                onSelect={() => handlePlanSelect(plan.id)}
              />
            ))}
          </div>
          
          {/* Features Comparison */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-6 text-center">Compare Plan Features</h2>
            <FeatureComparison features={featureComparison} />
          </div>
        </div>
      )}
      
      {/* Billing Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <h2 className="text-lg font-medium mb-4">Payment Method</h2>
            
            {subscription.payment_method ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {subscription.payment_method.brand === 'visa' ? (
                      <img 
                        src="/assets/visa-logo.svg" 
                        alt="Visa" 
                        className="h-8 w-auto mr-3" 
                      />
                    ) : subscription.payment_method.brand === 'mastercard' ? (
                      <img 
                        src="/assets/mastercard-logo.svg" 
                        alt="Mastercard" 
                        className="h-8 w-auto mr-3" 
                      />
                    ) : (
                      <CreditCard size={24} className="mr-3" />
                    )}
                    <div>
                      <div className="font-medium">
                        {subscription.payment_method.brand?.charAt(0).toUpperCase()}{subscription.payment_method.brand?.slice(1)} ending in {subscription.payment_method.last4}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Expires {subscription.payment_method.expMonth}/{subscription.payment_method.expYear}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {showPaymentForm ? (
                  <PaymentMethodForm 
                    onSubmit={() => setShowPaymentForm(false)}
                    onCancel={() => setShowPaymentForm(false)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CreditCard size={48} className="text-gray-400 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No payment method on file</p>
                    <Button
                      variant="primary"
                      onClick={() => setShowPaymentForm(true)}
                    >
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Billing Information */}
          <Card>
            <h2 className="text-lg font-medium mb-4">Billing Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Billing Email</label>
                <input
                  type="email"
                  value={user?.email || ''} 
                  readOnly
                  className="form-control bg-gray-50 dark:bg-gray-800"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Your company name"
                    className="form-control"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tax ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="VAT or tax identification number"
                    className="form-control"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Billing Address</label>
                <textarea
                  rows={3}
                  placeholder="Enter your billing address"
                  className="form-control"
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="primary"
                >
                  Save Billing Information
                </Button>
              </div>
            </div>
          </Card>
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
          ) : (
            <BillingHistory items={billingHistory} />
          )}
        </Card>
      )}
    </div>
  );
};

export default Subscription;