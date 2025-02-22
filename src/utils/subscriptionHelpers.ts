// src/utils/subscriptionHelpers.ts

import { 
    Subscription, 
    SubscriptionFeatures, 
    SubscriptionPaymentMethod,
    SubscriptionPlan,
    BillingCycle
  } from '../types/subscription';
  
  export interface PaymentMethod {
    id: string;
    type: 'card' | 'paypal' | 'bank_transfer';
    last4: string | null;
    brand: string | null;
    expMonth: number | null;
    expYear: number | null;
    isDefault: boolean;
  }
  
  export const formatPaymentMethodForSubscription = (
    paymentMethod: PaymentMethod | null | undefined
  ): SubscriptionPaymentMethod | null => {
    if (!paymentMethod) return null;
    return {
      brand: paymentMethod.brand,
      last4: paymentMethod.last4,
      expMonth: paymentMethod.expMonth,
      expYear: paymentMethod.expYear
    };
  };
  
  export const createUpdatedSubscription = (
    prevState: Subscription,
    updates: Partial<Subscription>
  ): Subscription => {
    return {
      ...prevState,
      ...updates,
      updated_at: new Date().toISOString()
    };
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