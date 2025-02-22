// src/contexts/SubscriptionContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import { Subscription, defaultSubscription } from '../types/subscription';
import { getSubscriptionDetails } from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: Subscription;
  loading: boolean;
  error: string | null;
  setSubscription: React.Dispatch<React.SetStateAction<Subscription>>;
  refreshSubscription: () => Promise<void>;
}

export const defaultSubscription: Subscription = {
  id: '',
  user_id: '',
  plan: 'basic',
  status: 'active',
  billing_cycle: 'monthly',
  price_id: null,
  customer_id: null,
  start_date: new Date().toISOString(),
  end_date: null,
  trial_end: null,
  next_billing_date: new Date().toISOString(),
  cancellation_date: null,
  payment_method: {
    brand: null,
    last4: null,
    expMonth: null,
    expYear: null
  },
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
  },
  created_at: new Date().toISOString(),
  updated_at: null,
  currentPeriodEnd: new Date().toISOString()
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