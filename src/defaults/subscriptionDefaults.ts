// src/defaults/subscriptionDefaults.ts

import { Subscription, SubscriptionFeatures } from '../types/subscription';

export const defaultFeatures: SubscriptionFeatures = {
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
};

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
  features: defaultFeatures,
  created_at: new Date().toISOString(),
  updated_at: null,
  currentPeriodEnd: new Date().toISOString()
};