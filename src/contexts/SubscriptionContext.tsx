// src/contexts/SubscriptionContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { Subscription } from '../types/subscription';
import { getSubscriptionDetails } from '../services/subscriptionService';

type SubscriptionContextType = {
  subscription: Subscription;
  loading: boolean;
  error: string | null;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
  refreshSubscription: () => Promise<void>;
};

const defaultSubscription: Subscription = {
  id: '',
  plan: 'basic',
  status: 'active', // Using 'active' instead of 'inactive' to match SubscriptionStatus type
  billing_cycle: 'monthly',
  startDate: '',
  nextBillingDate: '',
  features: {
    maxJobsites: 0,
    maxEmailTemplates: 0,
    advancedAnalytics: false,
    customEmails: false,
    prioritySupport: false,
    smsNotifications: false,
    customReports: false,
    apiAccess: false,
    whiteLabeling: false,
    singleSignOn: false
  }
};

export const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: defaultSubscription,
  loading: true,
  error: null,
  setSubscription: () => {},
  refreshSubscription: async () => {}
});

export const SubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionDetails();
      setSubscription(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{ subscription, loading, error, setSubscription, refreshSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};